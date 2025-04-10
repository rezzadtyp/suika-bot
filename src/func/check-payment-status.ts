import axios from "axios";
import { keyOrkut, merchantId } from "../config";

export const checkPaymentStatus = async (totalAmount: number) => {
  try {
    const response = await axios.get(
      `https://gateway.okeconnect.com/api/mutasi/qris/${merchantId}/${keyOrkut}`,
      {
        timeout: 10000,
      }
    );

    if (!response.data || !response.data.data) {
      return { status: "pending" };
    }

    const matchingPayment = response.data.data.find(
      (payment: { amount: { toString: () => string }; type: string }) =>
        payment.amount.toString() === totalAmount.toString() &&
        payment.type === "CR"
    );

    return {
      status: matchingPayment ? "success" : "pending",
    };
  } catch (error) {
    console.error("Error checking payment status:", error);
    return { status: "pending" };
  }
};
