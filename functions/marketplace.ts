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

        const { action } = await req.json();

        switch (action) {
            case 'listItem':
                const { itemId, price, isAuction, duration } = await req.json();
                const listing = await listItemForSale(user.id, itemId, price, isAuction, duration);
                return new Response(JSON.stringify(listing), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'purchaseItem':
                const { listingId } = await req.json();
                const purchase = await purchaseItem(user.id, listingId);
                return new Response(JSON.stringify(purchase), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'placeBid':
                const { auctionId, bidAmount } = await req.json();
                const bid = await placeBid(user.id, auctionId, bidAmount);
                return new Response(JSON.stringify(bid), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'getMarketListings':
                const { category, rarity, gameId, sortBy } = await req.json();
                const listings = await getMarketListings(category, rarity, gameId, sortBy);
                return new Response(JSON.stringify({ listings }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'getUserTransactions':
                const transactions = await getUserTransactions(user.id);
                return new Response(JSON.stringify({ transactions }), {
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

async function listItemForSale(userId, itemId, price, isAuction, duration) {
    // In a real app, this would create a marketplace listing
    const listing = {
        id: Date.now(),
        sellerId: userId,
        itemId,
        price,
        isAuction,
        duration: isAuction ? duration : null,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: isAuction ? new Date(Date.now() + duration * 60 * 60 * 1000).toISOString() : null
    };

    return {
        success: true,
        listing,
        message: isAuction ? 'Item listed for auction!' : 'Item listed for sale!'
    };
}

async function purchaseItem(buyerId, listingId) {
    // Simulate purchase transaction
    const user = await base44.auth.me();
    const itemPrice = 5000; // This would come from the listing
    
    if ((user.avatar_gamer_points || 0) < itemPrice) {
        return {
            success: false,
            message: 'Insufficient AGP to purchase this item'
        };
    }

    // Deduct AGP
    await base44.entities.User.updateMyUserData({
        avatar_gamer_points: (user.avatar_gamer_points || 0) - itemPrice
    });

    return {
        success: true,
        message: 'Item purchased successfully!',
        transaction: {
            id: Date.now(),
            type: 'purchase',
            amount: itemPrice,
            timestamp: new Date().toISOString()
        }
    };
}

async function placeBid(bidderId, auctionId, bidAmount) {
    const user = await base44.auth.me();
    
    if ((user.avatar_gamer_points || 0) < bidAmount) {
        return {
            success: false,
            message: 'Insufficient AGP for this bid'
        };
    }

    return {
        success: true,
        message: 'Bid placed successfully!',
        bid: {
            id: Date.now(),
            auctionId,
            bidderId,
            amount: bidAmount,
            timestamp: new Date().toISOString()
        }
    };
}

async function getMarketListings(category, rarity, gameId, sortBy) {
    // Simulate marketplace listings
    return [
        {
            id: 1,
            name: "Dragon Sword",
            price: 15000,
            rarity: "Legendary",
            category: "Weapon",
            gameId: "elder_scrolls_reborn",
            sellerId: "player123",
            isAuction: false
        },
        {
            id: 2,
            name: "Cyber Implant",
            price: 25000,
            rarity: "Epic",
            category: "Augmentation",
            gameId: "cyberpunk_2088",
            sellerId: "player456",
            isAuction: true,
            timeLeft: "2h 15m"
        }
    ];
}

async function getUserTransactions(userId) {
    // Simulate transaction history
    return [
        {
            id: 1,
            type: 'sale',
            itemName: 'Phoenix Blade',
            amount: 8500,
            timestamp: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 2,
            type: 'purchase',
            itemName: 'Shadow Cloak',
            amount: -12000,
            timestamp: new Date(Date.now() - 172800000).toISOString()
        }
    ];
}