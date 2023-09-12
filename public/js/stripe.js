import axios from "axios";
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
    const stripe = stripe(process.env.STRIPE_PUBLIC_KEY)
    
    try {
        // 1. Get checkout session from the API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
         
        // 2. Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch (err) {
        showAlert('error', err);
    }
    
}