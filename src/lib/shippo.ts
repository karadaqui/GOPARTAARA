import { supabase } from "@/integrations/supabase/client";

export type ShippoAddress = {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string; // ISO-2, e.g. "GB"
  phone?: string;
  email?: string;
};

export type ShippoParcel = {
  length: number; // cm
  width: number;  // cm
  height: number; // cm
  weight: number; // kg
};

export type ShippoRate = {
  object_id: string;
  amount: string;
  currency: string;
  provider: string;
  servicelevel: { name: string; token: string };
  estimated_days?: number;
  duration_terms?: string;
};

export async function shippoGetRates(payload: {
  address_from: ShippoAddress;
  address_to: ShippoAddress;
  parcel: ShippoParcel;
  category?: string | null;
  carrier_preference?: string;
}): Promise<{ rates: ShippoRate[]; shipment_id: string }> {
  const { data, error } = await supabase.functions.invoke("create-shippo-label", {
    body: { action: "get_rates", ...payload },
  });
  if (error) throw error;
  return data;
}

export async function shippoPurchaseLabel(payload: {
  rate_id: string;
  order_id: string;
}): Promise<{ label_url: string; tracking_number: string; carrier: string; transaction_id: string }> {
  const { data, error } = await supabase.functions.invoke("create-shippo-label", {
    body: { action: "purchase_label", ...payload },
  });
  if (error) throw error;
  return data;
}

export async function shippoCreateOrder(payload: {
  offer_id: string;
  shipping_address: ShippoAddress;
  buyer_name: string;
  buyer_email: string;
}): Promise<{ order_id: string; duplicate?: boolean }> {
  const { data, error } = await supabase.functions.invoke("create-shippo-label", {
    body: { action: "create_order", ...payload },
  });
  if (error) throw error;
  return data;
}
