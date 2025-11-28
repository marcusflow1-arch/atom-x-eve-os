import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401 });
        }
        
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        const user = await base44.auth.me();
        
        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { action, videoData, accessToken } = await req.json();

        switch (action) {
            case 'uploadToTikTok':
                const result = await uploadVideoToTikTok(videoData, accessToken);
                return new Response(JSON.stringify(result), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'getAuthUrl':
                const authUrl = getTikTokAuthUrl();
                return new Response(JSON.stringify({ authUrl }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'exchangeCode':
                const { code } = await req.json();
                const tokens = await exchangeCodeForTokens(code);
                return new Response(JSON.stringify(tokens), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            default:
                return new Response('Invalid action', { status: 400 });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

function getTikTokAuthUrl() {
    const clientId = Deno.env.get('TIKTOK_CLIENT_ID');
    const redirectUri = Deno.env.get('TIKTOK_REDIRECT_URI');
    
    const scope = 'video.upload';
    const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
    
    return authUrl;
}

async function exchangeCodeForTokens(code) {
    const clientId = Deno.env.get('TIKTOK_CLIENT_ID');
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');
    const redirectUri = Deno.env.get('TIKTOK_REDIRECT_URI');

    const response = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_key: clientId,
            client_secret: clientSecret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
        })
    });

    return await response.json();
}

async function uploadVideoToTikTok(videoData, accessToken) {
    const { title, videoUrl, tags } = videoData;
    
    try {
        // Step 1: Initialize upload
        const initResponse = await fetch('https://open-api.tiktok.com/share/video/upload/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                video_size: videoData.videoSize || 0,
                chunk_size: 10000000, // 10MB chunks
                total_chunk: 1
            })
        });

        const initResult = await initResponse.json();
        
        if (!initResponse.ok) {
            throw new Error(initResult.message || 'Failed to initialize TikTok upload');
        }

        const uploadUrl = initResult.data.upload_url;
        const publishId = initResult.data.publish_id;

        // Step 2: Upload video file
        const videoResponse = await fetch(videoUrl);
        const videoBlob = await videoResponse.blob();

        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: videoBlob,
            headers: {
                'Content-Type': 'video/mp4'
            }
        });

        if (!uploadResponse.ok) {
            throw new Error('Failed to upload video to TikTok');
        }

        // Step 3: Publish video
        const publishResponse = await fetch('https://open-api.tiktok.com/share/video/publish/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                publish_id: publishId,
                video_info: {
                    title: title,
                    privacy_level: 'PUBLIC_TO_EVERYONE',
                    disable_duet: false,
                    disable_comment: false,
                    disable_stitch: false,
                    video_cover_timestamp_ms: 1000
                }
            })
        });

        const publishResult = await publishResponse.json();

        if (publishResponse.ok && publishResult.data) {
            return {
                success: true,
                videoId: publishResult.data.share_id,
                message: 'Video uploaded successfully to TikTok!'
            };
        } else {
            throw new Error(publishResult.message || 'TikTok publish failed');
        }

    } catch (error) {
        throw new Error(`TikTok upload failed: ${error.message}`);
    }
}