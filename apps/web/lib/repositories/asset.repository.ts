import type { SupabaseClient } from "@supabase/supabase-js";
import type { Asset, AssetInsert, AssetUpdate, AssetType } from "@repo/database";
import { BaseRepository } from "./base.repository";

/**
 * Repository for asset/account operations
 * Assets represent bank accounts, cash, investments, etc.
 */
class AssetRepository extends BaseRepository<Asset, AssetInsert, AssetUpdate> {
  protected tableName = "assets";

  /**
   * Find assets by type
   */
  async findByType(
    supabase: SupabaseClient,
    userId: string,
    type: AssetType
  ): Promise<Asset[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Asset[];
  }

  /**
   * Find liquid assets (cash, checking, savings)
   */
  async findLiquid(supabase: SupabaseClient, userId: string): Promise<Asset[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("is_liquid", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Asset[];
  }

  /**
   * Get total balance across all assets
   */
  async getTotalBalance(supabase: SupabaseClient, userId: string): Promise<number> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("balance")
      .eq("user_id", userId);

    if (error) throw error;
    return (data ?? []).reduce((sum, a) => sum + Number(a.balance), 0);
  }

  /**
   * Get total balance by type
   */
  async getTotalByType(
    supabase: SupabaseClient,
    userId: string,
    type: AssetType
  ): Promise<number> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("balance")
      .eq("user_id", userId)
      .eq("type", type);

    if (error) throw error;
    return (data ?? []).reduce((sum, a) => sum + Number(a.balance), 0);
  }

  /**
   * Update asset balance
   */
  async updateBalance(
    supabase: SupabaseClient,
    id: string,
    userId: string,
    newBalance: number
  ): Promise<Asset> {
    return this.update(supabase, id, userId, { balance: newBalance });
  }

  /**
   * Add to asset balance
   */
  async addToBalance(
    supabase: SupabaseClient,
    id: string,
    userId: string,
    amount: number
  ): Promise<Asset> {
    const asset = await this.findById(supabase, id, userId);
    if (!asset) throw new Error("Asset not found");

    const newBalance = Number(asset.balance) + amount;
    return this.update(supabase, id, userId, { balance: newBalance });
  }

  /**
   * Subtract from asset balance
   */
  async subtractFromBalance(
    supabase: SupabaseClient,
    id: string,
    userId: string,
    amount: number
  ): Promise<Asset> {
    const asset = await this.findById(supabase, id, userId);
    if (!asset) throw new Error("Asset not found");

    const newBalance = Number(asset.balance) - amount;
    return this.update(supabase, id, userId, { balance: newBalance });
  }
}

// Export singleton instance
export const assetRepository = new AssetRepository();
