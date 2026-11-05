export const product = {
  id: "office-pants",
  name: "Quần ống suông cạp cao",
  subtitle: "Phong cách lịch sự công sở",
  price: 159_000,
  compareAt: 229_000,
  colors: ["Đen", "Ghi", "Kem", "Khói lạ", "Be khói", "Nâu"],
  sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
} as const;
export function pricing(quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20)
    throw new Error("Số lượng phải từ 1 đến 20.");
  const subtotal = product.price * quantity;
  const shipping = quantity >= 2 ? 0 : 30_000;
  return {
    unitPrice: product.price,
    subtotal,
    shipping,
    total: subtotal + shipping,
  };
}
export const money = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount,
  );
export type Checkout = {
  productId: string;
  color: string;
  size: string;
  quantity: number;
  name: string;
  phone: string;
  address: string;
  notes: string;
};
export class InputError extends Error {}
export function validateCheckout(raw: unknown): Checkout {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new InputError("Dữ liệu đặt hàng không hợp lệ.");
  const v = raw as Record<string, unknown>;
  const text = (key: string, min: number, max: number) => {
    const value = v[key];
    if (typeof value !== "string")
      throw new InputError("Vui lòng kiểm tra thông tin nhận hàng.");
    const cleaned = value.trim();
    if (
      cleaned.length < min ||
      cleaned.length > max ||
      /[\u0000-\u001f\u007f]/.test(value)
    )
      throw new InputError("Vui lòng kiểm tra thông tin nhận hàng.");
    return cleaned;
  };
  if (
    v.productId !== product.id ||
    !product.colors.includes(v.color as never) ||
    !product.sizes.includes(v.size as never)
  )
    throw new InputError("Vui lòng chọn màu và kích cỡ hợp lệ.");
  if (typeof v.quantity !== "number")
    throw new InputError("Số lượng không hợp lệ.");
  try {
    pricing(v.quantity);
  } catch {
    throw new InputError("Số lượng phải từ 1 đến 20.");
  }
  const phone = text("phone", 10, 16)
    .replace(/[ .-]/g, "")
    .replace(/^\+84/, "0");
  if (!/^0[35789]\d{8}$/.test(phone))
    throw new InputError("Số điện thoại Việt Nam không hợp lệ.");
  return {
    productId: product.id,
    color: v.color as string,
    size: v.size as string,
    quantity: v.quantity,
    name: text("name", 2, 80),
    phone,
    address: text("address", 15, 300),
    notes: v.notes === undefined ? "" : text("notes", 0, 500),
  };
}
