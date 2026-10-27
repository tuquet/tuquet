# SPEC: Migrate UI Kit từ `@tuquet/vue-ui` sang `@tuquet-core/shadcn-ui` (SSOT)

> **Status:** PROPOSED (Gated Review - Phase 1: SPECIFY)  
> **Target Module:** `@tuquet-core/shadcn-ui` & `@tuquet/admin-web`  
> **Date:** 2026-10-22  

---

## 1. Objective (Mục tiêu)

- **Tại sao cần di chuyển?** 
  - Hiện tại dự án bị phân mảnh 2 nguồn UI primitives: `@tuquet-core/shadcn-ui` (core framework nội bộ) và `@tuquet/vue-ui` (catalog package bên ngoài).
  - Gói `@tuquet/vue-ui` bên ngoài gây ra tình trạng "hộp đen" (code đã build minified), chặn HMR mượt mà, gây lỗi reactive (như sự cố Drawer không đóng được với 2 nút X), và làm chậm tốc độ reasoning của AI Agent do vòng lặp grep vô định.
- **Mục tiêu đạt được:**
  - Thiết lập [`admin/packages/@core/ui-kit/shadcn-ui`](file:///C:/Users/ndtu6/Repository/tuquet/admin/packages/@core/ui-kit/shadcn-ui) làm **Single Source of Truth (SSOT)** duy nhất cho mọi thành phần UI trong `admin`.
  - Khai tử (Deprecate & Remove) hoàn toàn phụ thuộc vào `@tuquet/vue-ui`.
  - Cung cấp 100% mã nguồn Vue SFC tường minh, giải phóng tốc độ reasoning của Agent và bảo đảm HMR tức thì.
  - Sửa dứt điểm cơ chế đóng mở của `vxe-row-detail-sheet.vue` bằng chuẩn `<SheetClose>` của `reka-ui`.

---

## 2. Assumptions (Giả định cốt lõi)

1. `@tuquet-core/shadcn-ui` đã sở hữu sẵn 38+ primitives nền tảng từ Shadcn-Vue & Reka-UI (`button`, `sheet`, `dialog`, `badge`, `select`, `input`, `card`, `switch`, `popover`, `tabs`...).
2. `toast` và `Toaster` sẽ được tích hợp trực tiếp vào `@tuquet-core/shadcn-ui` thông qua `vue-sonner` (chuẩn Shadcn-Vue official) để thay thế toast của `@tuquet/vue-ui`.
3. Mọi view trong `apps/web-admin` chỉ import UI từ `@tuquet-core/shadcn-ui`.

---

## 3. Scope & Inventory Mapping (Ánh xạ Primitives)

Toàn bộ các import từ `@tuquet/vue-ui` trong `apps/web-admin` được map 1-1 sang `@tuquet-core/shadcn-ui`:

| Primitive cũ (`@tuquet/vue-ui`) | Component đích (`@tuquet-core/shadcn-ui`) | Trạng thái hiện tại trong core |
| :--- | :--- | :--- |
| `Button` | `Button` (hoặc `VbenButton`) | Đã có sẵn tại `ui/button` |
| `Badge` | `Badge` | Đã có sẵn tại `ui/badge` |
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter` | `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter` | Đã có sẵn tại `ui/sheet` |
| `SheetClose` | `SheetClose` | Đã có sẵn tại `ui/sheet/SheetClose.vue` |
| `Input` | `Input` | Đã có sẵn tại `ui/input` |
| `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` | `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` | Đã có sẵn tại `ui/select` |
| `Popover`, `PopoverTrigger`, `PopoverContent` | `Popover`, `PopoverTrigger`, `PopoverContent` | Đã có sẵn tại `ui/popover` |
| `Card`, `CardContent`, `CardHeader`, `CardTitle` | `Card`, `CardContent`, `CardHeader`, `CardTitle` | Đã có sẵn tại `ui/card` |
| `Switch` | `Switch` | Đã có sẵn tại `ui/switch` |
| `Textarea` | `Textarea` | Đã có sẵn tại `ui/textarea` |
| `Spinner` | `VbenSpinner` hoặc export alias `Spinner` | Đã có tại `components/spinner` |
| `toast`, `Toaster` | `toast`, `Toaster` (tích hợp `vue-sonner` vào `ui/sonner`) | Cần bổ sung vào `ui/sonner` |

---

## 4. API & Interface Contract

### A. Tích hợp Sonner Toast vào `@tuquet-core/shadcn-ui`
- Thư mục: `packages/@core/ui-kit/shadcn-ui/src/ui/sonner/`
  - `Sonner.vue` (wrap `Toaster` từ `vue-sonner` với tailwind styling chuẩn dự án).
  - `toast` export trực tiếp từ `vue-sonner`.
- Export công khai tại `packages/@core/ui-kit/shadcn-ui/src/ui/index.ts`:
  ```ts
  export { toast, Toaster } from './sonner';
  ```

### B. Chuẩn hóa `vxe-row-detail-sheet.vue`
- Loại bỏ nút X thủ công tự render trong `SheetHeader`.
- Tận dụng nút đóng mặc định của `<SheetContent>` hoặc dùng `<SheetClose as-child>`:
  ```vue
  <SheetClose as-child>
    <Button variant="ghost" size="icon" class="size-7">
      <X class="size-4" />
    </Button>
  </SheetClose>
  ```
- Sử dụng `defineModel<boolean>('open')` để đồng bộ hai chiều state với adapter.

---

## 5. Execution Plan (Các bước thực hiện)

```
[Phase 1: Chuẩn bị Core UI Kit]
  └── Thêm sonner vào @tuquet-core/shadcn-ui (toast, Toaster)
  └── Đảm bảo tất cả component alias (Spinner, Table, v.v.) được export đầy đủ

[Phase 2: Chuyển đổi mã nguồn apps/web-admin]
  └── Chuyển toàn bộ import từ '@tuquet/vue-ui' sang '@tuquet-core/shadcn-ui'
  └── Chuẩn hóa SheetClose & v-model trong vxe-row-detail-sheet.vue

[Phase 3: Dọn dẹp phụ thuộc & Verification]
  └── Gỡ '@tuquet/vue-ui' khỏi apps/web-admin/package.json và catalog
  └── Chạy pnpm typecheck & test:unit
  └── Kiểm tra trực tiếp trên trình duyệt http://localhost:5320/automation/browsers
```

---

## 6. Success Criteria (Tiêu chí nghiệm thu)

1. `grep -rn "@tuquet/vue-ui" apps/web-admin/` trả về **0 kết quả**.
2. `pnpm --filter @tuquet/admin-web run typecheck` vượt qua sạch sẽ (0 lỗi).
3. Đóng mở Drawer tại `/automation/browsers` mượt mà qua nút **X** (chỉ có duy nhất 1 nút X chuẩn) và nút **Close** ở footer.
4. Mọi thông báo `toast.success`, `toast.error` hoạt động chính xác bằng Sonner Toast.
