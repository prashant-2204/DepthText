import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const POST = async (request: Request) => {
  try {
    // Use an existing Customer ID if this is a returning customer.
    const { amount } = await request.json();

    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-11-20.acacia" }
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount) * 100,
      currency: "usd",
      customer: customer.id,
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter
      // is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
        publishableKey:
          "pk_test_51QP06oSCWqTPCuyVpybhVoUH9061gubJ1Lnpdam27GBJSmORsyQEqqYxtXAYvSzBdZ13h3jf0VdcdmIlRDqEsm6K00rdKUsFGA",
      }),
      {
        status: 200,
      }
    );
  } catch (err: any) {
    console.log(err);
    return new Response(
      JSON.stringify({ statusCode: 500, message: err.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
