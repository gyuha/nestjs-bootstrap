export declare const OrderStatus: {
  readonly PENDING: "PENDING";
  readonly CONFIRMED: "CONFIRMED";
  readonly SHIPPED: "SHIPPED";
  readonly DELIVERED: "DELIVERED";
  readonly CANCELLED: "CANCELLED";
};
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
