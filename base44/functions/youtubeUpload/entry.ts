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
            case 'uploadToYoutube':
                const result = await uploadVideoToYoutube(videoData, accessToken);
                return new Response(JSON.stringify(result), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'getAuthUrl':
                const authUrl = getYouTubeAuthUrl();
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

function getYouTubeAuthUrl() {
    const clientId = Deno.env.get('YOUTUBE_CLIENT_ID');
    const redirectUri = Deno.env.get('YOUTUBE_REDIRECT_URI');
    
    const scope = 'https://www.googleapis.com/auth/youtube.upload';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline`;
    
    return authUrl;
}

async function exchangeCodeForTokens(code) {
    const clientId = Deno.env.get('YOUTUBE_CLIENT_ID');
    const clientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET');
    const redirectUri = Deno.env.get('YOUTUBE_REDIRECT_URI');

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        })
    });

    return await response.json();
}

async function uploadVideoToYoutube(videoData, accessToken) {
    const { title, description, videoUrl, tags, privacy } = videoData;
    
    // First, get the video file
    const videoResponse = await fetch(videoUrl);
    const videoBlob = await videoResponse.blob();

    // Prepare metadata
    const metadata = {
        snippet: {
            title: title,
            description: description,
            tags: tags || [],
            categoryId: '20' // Gaming category
        },
        status: {
            privacyStatus: privacy || 'private'
        }
    };

    // Create form data for multipart upload
    const formData = new FormData();
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('video', videoBlob);

    // Upload to YouTube
    const uploadResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
        body: formData
    });

    const uploadResult = await uploadResponse.json();
    
    if (uploadResponse.ok) {
        return {
            success: true,
            videoId: uploadResult.id,
            videoUrl: `https://www.youtube.com/watch?v=${uploadResult.id}`,
            message: 'Video uploaded successfully to YouTube!'
        };
    } else {
        throw new Error(uploadResult.error?.message || 'YouTube upload failed');
    }
}