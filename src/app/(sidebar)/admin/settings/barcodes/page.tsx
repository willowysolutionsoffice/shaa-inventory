"use client";

import { useEffect, useMemo, useState } from "react";
import { Barcode, Pencil, Plus, Save, Star, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type StickerSetting = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  labelWidthMm: number;
  labelHeightMm: number;
  columns: number;
  barcodeHeightMm: number;
  showBrand: boolean;
  showPrice: boolean;
  showSku: boolean;
  continuousFeed: boolean;
  topMarginIn: number;
  leftMarginIn: number;
  stickerWidthIn: number;
  stickerHeightIn: number;
  paperWidthIn: number;
  paperHeightIn: number;
  rowGapIn: number;
  columnGapIn: number;
  stickersPerSheet: number;
};

const empty = (): Omit<StickerSetting, "id" | "isDefault"> => ({
  name: "",
  description: "",
  labelWidthMm: 38,
  labelHeightMm: 25,
  columns: 2,
  barcodeHeightMm: 9,
  showBrand: true,
  showPrice: true,
  showSku: true,
  continuousFeed: true,
  topMarginIn: 0.1,
  leftMarginIn: 0.1,
  stickerWidthIn: 1.38,
  stickerHeightIn: 0.98,
  paperWidthIn: 3.35,
  paperHeightIn: 2.2,
  rowGapIn: 0.12,
  columnGapIn: 0.12,
  stickersPerSheet: 1,
});

export default function BarcodeSettingsPage() {
  const [settings, setSettings] = useState<StickerSetting[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<StickerSetting | null>(null);
  const [draft, setDraft] = useState<any>(empty());
  const [setAsDefault, setSetAsDefault] = useState(false);

  // When continuousFeed is toggled, adjust dependent fields
  useEffect(() => {
    if (draft.continuousFeed) {
      // Sheet-specific fields are irrelevant for continuous rolls
      setDraft((prev: any) => ({
        ...prev,
        paperHeightIn: 0,
        rowGapIn: 0,
        columnGapIn: 0,
        // stickersPerSheet must stay >= 1 (backend validation)
        stickersPerSheet: Math.max(1, Number(prev.stickersPerSheet) || 1),
      }));
    }
  }, [draft.continuousFeed]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setSettings(await api.get<StickerSetting[]>("/barcode-sticker-settings"));
    } catch (error: any) {
      toast.error(error.message || "Unable to load barcode settings");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const visible = useMemo(
    () =>
      settings.filter((s) =>
        `${s.name} ${s.description ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [settings, query],
  );
  const close = () => {
    setEditing(null);
    setDraft(empty());
    setSetAsDefault(false);
  };
  const save = async () => {
    try {
      const body = {
        ...draft,
        labelWidthMm: Number(draft.labelWidthMm),
        labelHeightMm: Number(draft.labelHeightMm),
        columns: Number(draft.columns),
        barcodeHeightMm: Number(draft.barcodeHeightMm),
        topMarginIn: Number(draft.topMarginIn),
        leftMarginIn: Number(draft.leftMarginIn),
        stickerWidthIn: Number(draft.stickerWidthIn),
        stickerHeightIn: Number(draft.stickerHeightIn),
        paperWidthIn: Number(draft.paperWidthIn),
        paperHeightIn: Number(draft.paperHeightIn),
        rowGapIn: Number(draft.rowGapIn),
        columnGapIn: Number(draft.columnGapIn),
        stickersPerSheet: Number(draft.stickersPerSheet),
      };
      if (editing?.id) {
        await api.patch(`/barcode-sticker-settings/${editing.id}`, body);
        if (setAsDefault) await setDefault(editing.id);
      } else {
        const created = await api.post<StickerSetting>(
          "/barcode-sticker-settings",
          body,
        );
        if (setAsDefault && created?.id) await setDefault(created.id);
      }
      toast.success(
        editing?.id ? "Barcode setting updated" : "Barcode setting created",
      );
      close();
      await load();
    } catch (error: any) {
      toast.error(error.message || "Unable to save barcode setting");
    }
  };
  const setDefault = async (id: string) => {
    try {
      await api.post(`/barcode-sticker-settings/${id}/default`, {});
      toast.success("Default barcode setting updated");
      await load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };
  const remove = async (id: string) => {
    try {
      await api.delete(`/barcode-sticker-settings/${id}`);
      toast.success("Barcode setting deleted");
      await load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };
  const field = (key: string, label: string, type = "number") => {
    // Hide sheet-specific fields entirely when continuous feed is on
    if (
      draft.continuousFeed &&
      (key === "paperHeightIn" || key === "stickersPerSheet")
    ) {
      return null;
    }
    return (
      <div className="space-y-1">
        <Label htmlFor={key}>{label}</Label>
        <Input
          id={key}
          type={type}
          value={draft[key] ?? ""}
          disabled={
            draft.continuousFeed &&
            (key === "rowGapIn" || key === "columnGapIn")
          }
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="border-border flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Barcode className="text-primary h-6 w-6" /> Barcodes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage product barcode sticker settings
          </p>
        </div>
        <Button
          onClick={() => {
            close();
            setEditing({} as StickerSetting);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add new setting
        </Button>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>All barcode settings</CardTitle>
          </div>
          <Input
            className="w-full sm:w-56"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-b text-left">
                <tr>
                  <th className="p-3">Sticker setting name</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Label</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-6 text-center" colSpan={4}>
                      Loading settings…
                    </td>
                  </tr>
                ) : (
                  visible.map((setting) => (
                    <tr key={setting.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">
                        {setting.name}
                        {setting.isDefault && (
                          <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                            Default
                          </span>
                        )}
                      </td>
                      <td className="text-muted-foreground p-3">
                        {setting.description || "—"}
                      </td>
                      <td className="text-muted-foreground p-3">
                        {setting.labelWidthMm} × {setting.labelHeightMm} mm ·{" "}
                        {setting.columns} columns
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(setting);
                              setDraft(setting);
                              setSetAsDefault(Boolean(setting.isDefault));
                            }}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                          </Button>
                          {!setting.isDefault && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDefault(setting.id)}
                              >
                                <Star className="mr-1 h-3.5 w-3.5" /> Default
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => remove(setting.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {editing && (
        <Card className="border-primary/30">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>
              {editing.id ? "Edit barcode setting" : "Add barcode setting"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={close} data-slot="card-action">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {field("name", "Sticker sheet setting name *", "text")}{" "}
              {field(
                "description",
                "Sticker sheet setting description",
                "text",
              )}{" "}
              {field("topMarginIn", "Additional top margin (inches) *")}{" "}
              {field("leftMarginIn", "Additional left margin (inches) *")}{" "}
              {field("stickerWidthIn", "Width of sticker (inches) *")}{" "}
              {field("stickerHeightIn", "Height of sticker (inches) *")}{" "}
              {field("paperWidthIn", "Paper width (inches) *")}{" "}
              {field("paperHeightIn", "Paper height (inches) *")}{" "}
              {field("columns", "Stickers in one row *")}{" "}
              {field("rowGapIn", "Distance between two rows (inches) *")}{" "}
              {field("columnGapIn", "Distance between two columns (inches) *")}{" "}
              {field("stickersPerSheet", "No. of stickers per sheet *")}
            </div>
            <div className="flex flex-wrap gap-6">
              {(
                ["continuousFeed", "showBrand", "showPrice", "showSku"] as const
              ).map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={key}
                    checked={Boolean(draft[key])}
                    onCheckedChange={(checked) =>
                      setDraft({ ...draft, [key]: checked === true })
                    }
                  />
                  <Label htmlFor={key}>
                    {key === "continuousFeed"
                      ? "Continuous feed or rolls"
                      : key === "showBrand"
                        ? "Show brand"
                        : key === "showPrice"
                          ? "Show price"
                          : "Show SKU"}
                  </Label>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="setAsDefault"
                  checked={setAsDefault}
                  onCheckedChange={(checked) =>
                    setSetAsDefault(checked === true)
                  }
                />
                <Label htmlFor="setAsDefault">Set as default</Label>
              </div>
            </div>
            <Button onClick={save}>
              <Save className="mr-2 h-4 w-4" /> Save setting
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
