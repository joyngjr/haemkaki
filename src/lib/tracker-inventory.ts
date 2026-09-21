import type { ApiInventory, ApiInventoryItem } from "@/lib/api";

export type InventoryItem = ApiInventoryItem;

/** The Inventory card: whether it is shown, and the supplies it counts. */
export type InventoryState = ApiInventory;

/** What a profile starts with until the card is first changed. */
export const DEFAULT_INVENTORY: InventoryState = {
  visible: true,
  items: [
    { id: "gauze", name: "Gauze", quantity: 0 },
    { id: "syringes", name: "Syringes", quantity: 0 },
    { id: "saline", name: "Saline", quantity: 0 },
  ],
};
