import Stripe from 'stripe';

let stripeClient: Stripe | undefined;

const getStripe = (): Stripe => {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('process.env.STRIPE_SECRET_KEY is not set');
    }

    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
};

export default getStripe;
