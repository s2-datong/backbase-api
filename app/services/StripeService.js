const config = require('../../config');
const stripe = require('stripe')(config.service.payment.stripe.secret_key);

class StripeService{
    static async createCustomer(email, orgname){
        const customer = await stripe.customers.create({
            email, name: orgname
        });

        return customer;
    }

    static async addSource(customer_id, reference){
        await stripe.tokens.retrieve(reference);
        await stripe.customers.createSource( customer_id,
            {source: reference}
        );
    }

    static async subscribeCustomerToPlan(customer_id, plan_id){
        const subscription = await stripe.subscriptions.create({
                customer: customer_id,
                items: [{plan: plan_id}]
            }
        );

        return subscription.id;
    }

    static async cancelSubscription(subscription_code){
        await stripe.subscriptions.del(subscription_code);
    }

    static async fullRefund(charge_id, reason){
        const data = {charge: charge_id};
        if(reason && reason != null) data.reason = reason;
        await stripe.refunds.create(data);
    }

    static async refundPayment(charge_id, amount, reason){
        const data = {charge: charge_id, amount: amount * 100 };
        if(reason && reason != null) data.reason = reason;
        await stripe.refunds.create(data);
    }

    static async updateCustomerName(customer_id, customer_name){
        await stripe.customers.update(
            customer_id, {name: customer_name}
        );
    }
}

module.exports = StripeService;