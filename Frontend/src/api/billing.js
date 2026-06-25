import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

export const createCheckoutSession = async ({ planType, billingPeriod }) => {
  const res = await axios.post(
    `${BASE_URL}/api/billing/checkout-session`,
    { planType, billingPeriod },
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );

  return res.data;
};

export const verifyCheckoutSession = async (sessionId) => {
  const res = await axios.get(`${BASE_URL}/api/billing/verify-session`, {
    params: { sessionId },
    withCredentials: true,
  });

  return res.data;
};
