import { fetchAPI } from "@/lib/fetch";
import { Stripe } from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { name, email, amount, paymentMethod } = await request.json();

    if (!name || !email || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
        }
      );
    }
    let customer;
    const doesCustomerExist = await stripe.customers.list({
      email,
    });
    if (doesCustomerExist.data.length > 0) {
      customer = doesCustomerExist.data[0];
    } else {
      const newCustomer = await stripe.customers.create({
        name,
        email,
      });
      customer = newCustomer;
    }
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-06-20" }
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount) * 100,
      currency: "usd",
      customer: customer.id,
      payment_method: paymentMethod,
      confirm: true,
      automatic_payment_methods: {
        enabled: false,
      },
    });
    console.log(ephemeralKey, customer.id);
    // // update - we can continue working here...
    // if (paymentIntent.client_secret) {
    //    const { result } = await fetchAPI("/(api)/(stripe)/pay", {
    //                 method: "POST",
    //                 headers: {
    //                   "Content-Type": "application/json",
    //                 },
    //                 body: JSON.stringify({
    //                   payment_method_id: paymentMethod.id,
    //                   payment_intent_id: paymentIntent.id,
    //                   customer_id: customer,
    //                   client_secret: paymentIntent.client_secret,
    //                 }),
    //               });
    // }
    return Response.json(
      {
        paymentIntent,
        ephemeralKey,
        customer: customer.id,
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.log(error);
    return Response.json({ error }, { status: 500 });
  }
}
