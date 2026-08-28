export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.15'
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bien_dong_quy: {
        Row: {
          chu_ky_id: string | null
          ghi_chu: string | null
          id: string
          khoan_muon_id: string | null
          loai: string
          ngay_local: string
          quy_id: string
          so_tien: number
          tao_luc: string
          user_id: string
        }
        Insert: {
          chu_ky_id?: string | null
          ghi_chu?: string | null
          id?: string
          khoan_muon_id?: string | null
          loai: string
          ngay_local: string
          quy_id: string
          so_tien: number
          tao_luc?: string
          user_id: string
        }
        Update: {
          chu_ky_id?: string | null
          ghi_chu?: string | null
          id?: string
          khoan_muon_id?: string | null
          loai?: string
          ngay_local?: string
          quy_id?: string
          so_tien?: number
          tao_luc?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bien_dong_quy_chu_ky_id_fkey'
            columns: ['chu_ky_id']
            isOneToOne: false
            referencedRelation: 'chu_ky'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bien_dong_quy_khoan_muon_id_fkey'
            columns: ['khoan_muon_id']
            isOneToOne: false
            referencedRelation: 'khoan_muon_quy'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bien_dong_quy_quy_id_fkey'
            columns: ['quy_id']
            isOneToOne: false
            referencedRelation: 'quy'
            referencedColumns: ['id']
          },
        ]
      }
      cau_dong_vien: {
        Row: {
          dieu_kien: Json | null
          id: string
          lan_dung_cuoi: string | null
          loai: string
          noi_dung: string
          tao_luc: string
          trang_thai: string
          user_id: string
        }
        Insert: {
          dieu_kien?: Json | null
          id?: string
          lan_dung_cuoi?: string | null
          loai: string
          noi_dung: string
          tao_luc?: string
          trang_thai?: string
          user_id: string
        }
        Update: {
          dieu_kien?: Json | null
          id?: string
          lan_dung_cuoi?: string | null
          loai?: string
          noi_dung?: string
          tao_luc?: string
          trang_thai?: string
          user_id?: string
        }
        Relationships: []
      }
      cau_hinh: {
        Row: {
          gia_tri: Json
          khoa: string
          mo_ta: string | null
          sua_luc: string
          user_id: string
        }
        Insert: {
          gia_tri: Json
          khoa: string
          mo_ta?: string | null
          sua_luc?: string
          user_id: string
        }
        Update: {
          gia_tri?: Json
          khoa?: string
          mo_ta?: string | null
          sua_luc?: string
          user_id?: string
        }
        Relationships: []
      }
      chu_ky: {
        Row: {
          id: string
          ngay_bat_dau_du_kien: string
          ngay_bat_dau_thuc_te: string
          ngay_ket_thuc: string
          snapshot_json: Json | null
          so_tien_de_danh_dinh_muc: number
          sua_luc: string
          tao_luc: string
          trang_thai: string
          user_id: string
        }
        Insert: {
          id?: string
          ngay_bat_dau_du_kien: string
          ngay_bat_dau_thuc_te: string
          ngay_ket_thuc: string
          snapshot_json?: Json | null
          so_tien_de_danh_dinh_muc?: number
          sua_luc?: string
          tao_luc?: string
          trang_thai?: string
          user_id: string
        }
        Update: {
          id?: string
          ngay_bat_dau_du_kien?: string
          ngay_bat_dau_thuc_te?: string
          ngay_ket_thuc?: string
          snapshot_json?: Json | null
          so_tien_de_danh_dinh_muc?: number
          sua_luc?: string
          tao_luc?: string
          trang_thai?: string
          user_id?: string
        }
        Relationships: []
      }
      danh_muc: {
        Row: {
          dinh_nghia: string
          hien_man_chinh: boolean
          hieu_luc_tu: string
          icon: string
          id: string
          la_he_thong: boolean
          slot: number | null
          sua_luc: string
          tao_luc: string
          ten: string
          thu_tu: number
          trang_thai: string
          user_id: string
        }
        Insert: {
          dinh_nghia?: string
          hien_man_chinh?: boolean
          hieu_luc_tu?: string
          icon?: string
          id?: string
          la_he_thong?: boolean
          slot?: number | null
          sua_luc?: string
          tao_luc?: string
          ten: string
          thu_tu?: number
          trang_thai?: string
          user_id: string
        }
        Update: {
          dinh_nghia?: string
          hien_man_chinh?: boolean
          hieu_luc_tu?: string
          icon?: string
          id?: string
          la_he_thong?: boolean
          slot?: number | null
          sua_luc?: string
          tao_luc?: string
          ten?: string
          thu_tu?: number
          trang_thai?: string
          user_id?: string
        }
        Relationships: []
      }
      giao_dich: {
        Row: {
          chu_ky_id: string | null
          danh_muc_id: string | null
          ghi_chu: string | null
          id: string
          idempotency_key: string | null
          loai: string
          ly_do_huy: string | null
          ngay_local: string
          nguon: string
          quy_id: string | null
          so_tien: number
          sua_luc: string
          tao_luc: string
          trang_thai: string
          user_id: string
          xay_ra_luc: string
        }
        Insert: {
          chu_ky_id?: string | null
          danh_muc_id?: string | null
          ghi_chu?: string | null
          id?: string
          idempotency_key?: string | null
          loai: string
          ly_do_huy?: string | null
          ngay_local: string
          nguon?: string
          quy_id?: string | null
          so_tien: number
          sua_luc?: string
          tao_luc?: string
          trang_thai?: string
          user_id: string
          xay_ra_luc?: string
        }
        Update: {
          chu_ky_id?: string | null
          danh_muc_id?: string | null
          ghi_chu?: string | null
          id?: string
          idempotency_key?: string | null
          loai?: string
          ly_do_huy?: string | null
          ngay_local?: string
          nguon?: string
          quy_id?: string | null
          so_tien?: number
          sua_luc?: string
          tao_luc?: string
          trang_thai?: string
          user_id?: string
          xay_ra_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: 'giao_dich_chu_ky_id_fkey'
            columns: ['chu_ky_id']
            isOneToOne: false
            referencedRelation: 'chu_ky'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'giao_dich_danh_muc_id_fkey'
            columns: ['danh_muc_id']
            isOneToOne: false
            referencedRelation: 'danh_muc'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'giao_dich_quy_fk'
            columns: ['quy_id']
            isOneToOne: false
            referencedRelation: 'quy'
            referencedColumns: ['id']
          },
        ]
      }
      han_muc: {
        Row: {
          chu_ky_id: string
          danh_muc_id: string
          so_tien: number
          sua_luc: string
          tao_luc: string
          user_id: string
        }
        Insert: {
          chu_ky_id: string
          danh_muc_id: string
          so_tien: number
          sua_luc?: string
          tao_luc?: string
          user_id: string
        }
        Update: {
          chu_ky_id?: string
          danh_muc_id?: string
          so_tien?: number
          sua_luc?: string
          tao_luc?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'han_muc_chu_ky_id_fkey'
            columns: ['chu_ky_id']
            isOneToOne: false
            referencedRelation: 'chu_ky'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'han_muc_danh_muc_id_fkey'
            columns: ['danh_muc_id']
            isOneToOne: false
            referencedRelation: 'danh_muc'
            referencedColumns: ['id']
          },
        ]
      }
      khoan_muon_quy: {
        Row: {
          chu_ky_muon_id: string
          con_lai: number
          id: string
          ky_han: string
          quy_id: string
          so_tien: number
          so_tien_moi_ky: number
          sua_luc: string
          tao_luc: string
          trang_thai: string
          user_id: string
        }
        Insert: {
          chu_ky_muon_id: string
          con_lai: number
          id?: string
          ky_han: string
          quy_id: string
          so_tien: number
          so_tien_moi_ky: number
          sua_luc?: string
          tao_luc?: string
          trang_thai?: string
          user_id: string
        }
        Update: {
          chu_ky_muon_id?: string
          con_lai?: number
          id?: string
          ky_han?: string
          quy_id?: string
          so_tien?: number
          so_tien_moi_ky?: number
          sua_luc?: string
          tao_luc?: string
          trang_thai?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'khoan_muon_quy_chu_ky_muon_id_fkey'
            columns: ['chu_ky_muon_id']
            isOneToOne: false
            referencedRelation: 'chu_ky'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'khoan_muon_quy_quy_id_fkey'
            columns: ['quy_id']
            isOneToOne: false
            referencedRelation: 'quy'
            referencedColumns: ['id']
          },
        ]
      }
      push_subscription: {
        Row: {
          auth: string
          endpoint: string
          id: string
          p256dh: string
          tao_luc: string
          trang_thai: string
          user_id: string
        }
        Insert: {
          auth: string
          endpoint: string
          id?: string
          p256dh: string
          tao_luc?: string
          trang_thai?: string
          user_id: string
        }
        Update: {
          auth?: string
          endpoint?: string
          id?: string
          p256dh?: string
          tao_luc?: string
          trang_thai?: string
          user_id?: string
        }
        Relationships: []
      }
      quy: {
        Row: {
          cho_phep_muon: string
          icon: string
          id: string
          ky_han_thang: number | null
          lai_suat_nam: number | null
          lich_tra_lai: string | null
          ngay_gui: string | null
          so_tien_dich: number | null
          sua_luc: string
          tao_luc: string
          ten: string
          thu_tu: number
          trang_thai: string
          user_id: string
        }
        Insert: {
          cho_phep_muon?: string
          icon?: string
          id?: string
          ky_han_thang?: number | null
          lai_suat_nam?: number | null
          lich_tra_lai?: string | null
          ngay_gui?: string | null
          so_tien_dich?: number | null
          sua_luc?: string
          tao_luc?: string
          ten: string
          thu_tu?: number
          trang_thai?: string
          user_id: string
        }
        Update: {
          cho_phep_muon?: string
          icon?: string
          id?: string
          ky_han_thang?: number | null
          lai_suat_nam?: number | null
          lich_tra_lai?: string | null
          ngay_gui?: string | null
          so_tien_dich?: number | null
          sua_luc?: string
          tao_luc?: string
          ten?: string
          thu_tu?: number
          trang_thai?: string
          user_id?: string
        }
        Relationships: []
      }
      quyet_dinh_mua: {
        Row: {
          bac_de_nguoi: string | null
          danh_muc_id: string | null
          giao_dich_id: string | null
          id: string
          nguoi_den: string | null
          so_tien: number
          sua_luc: string
          tao_luc: string
          ten_mon: string | null
          trang_thai: string
          user_id: string
        }
        Insert: {
          bac_de_nguoi?: string | null
          danh_muc_id?: string | null
          giao_dich_id?: string | null
          id?: string
          nguoi_den?: string | null
          so_tien: number
          sua_luc?: string
          tao_luc?: string
          ten_mon?: string | null
          trang_thai?: string
          user_id: string
        }
        Update: {
          bac_de_nguoi?: string | null
          danh_muc_id?: string | null
          giao_dich_id?: string | null
          id?: string
          nguoi_den?: string | null
          so_tien?: number
          sua_luc?: string
          tao_luc?: string
          ten_mon?: string | null
          trang_thai?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quyet_dinh_mua_danh_muc_id_fkey'
            columns: ['danh_muc_id']
            isOneToOne: false
            referencedRelation: 'danh_muc'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'quyet_dinh_mua_giao_dich_id_fkey'
            columns: ['giao_dich_id']
            isOneToOne: false
            referencedRelation: 'giao_dich'
            referencedColumns: ['id']
          },
        ]
      }
      su_kien: {
        Row: {
          doi_tuong: string | null
          du_lieu: Json
          duration_app_ms: number | null
          duration_ms: number | null
          id: number
          ma: string
          tao_luc: string
          user_id: string
        }
        Insert: {
          doi_tuong?: string | null
          du_lieu?: Json
          duration_app_ms?: number | null
          duration_ms?: number | null
          id?: number
          ma: string
          tao_luc?: string
          user_id: string
        }
        Update: {
          doi_tuong?: string | null
          du_lieu?: Json
          duration_app_ms?: number | null
          duration_ms?: number | null
          id?: number
          ma?: string
          tao_luc?: string
          user_id?: string
        }
        Relationships: []
      }
      thu_nhap: {
        Row: {
          chu_ky_id: string
          id: string
          ngay_local: string
          nguon_thu_nhap_id: string | null
          so_tien: number
          sua_luc: string
          tao_luc: string
          trang_thai: string
          user_id: string
        }
        Insert: {
          chu_ky_id: string
          id?: string
          ngay_local: string
          nguon_thu_nhap_id?: string | null
          so_tien: number
          sua_luc?: string
          tao_luc?: string
          trang_thai?: string
          user_id: string
        }
        Update: {
          chu_ky_id?: string
          id?: string
          ngay_local?: string
          nguon_thu_nhap_id?: string | null
          so_tien?: number
          sua_luc?: string
          tao_luc?: string
          trang_thai?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'thu_nhap_chu_ky_id_fkey'
            columns: ['chu_ky_id']
            isOneToOne: false
            referencedRelation: 'chu_ky'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      doi_ranh_gioi_chu_ky: {
        Args: {
          p_nay_bat_dau: string
          p_nay_id: string
          p_truoc_id: string | null
          p_truoc_ket_thuc: string | null
        }
        Returns: undefined
      }
      seed_nguoi_dung_moi: { Args: { uid: string }; Returns: undefined }
      sinh_id: { Args: { tien_to: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
