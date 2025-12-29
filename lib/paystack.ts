import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const initializePayment = async (email: string, amount: number, callbackUrl: string, metadata: any) => {
    const url = 'https://api.paystack.co/transaction/initialize';

    // Paystack expects amount in Kobo (Naira * 100)
    const amountInKobo = Math.round(amount * 100);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            amount: amountInKobo,
            callback_url: callbackUrl,
            metadata
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to initialize payment');
    }

    return response.json();
};

export const verifyPayment = async (reference: string) => {
    const url = `https://api.paystack.co/transaction/verify/${reference}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to verify payment');
    }

    return response.json();
};

export const verifyWebhookSignature = (body: any, signature: string) => {
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY!)
        .update(JSON.stringify(body))
        .digest('hex');

    return hash === signature;
};
