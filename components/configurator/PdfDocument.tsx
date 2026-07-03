"use client";

import { forwardRef, useMemo } from "react";
import {
  buildConfigurationSvg,
  type ConfigurationSvgInput,
} from "@/lib/fence/buildConfigurationSvg";
import type { ProductScope } from "@/lib/configurator/state";
import type {
  CatalogCollections,
  Color,
  ConfiguratorSelection,
  FootingHeight,
  FootingMaterial,
  Height,
  Panel,
  Post,
  PricingSettings,
  QuoteResult,
  SpacerOption,
} from "@/lib/types";

export type PdfDocumentProps = {
  catalog: CatalogCollections;
  selection: ConfiguratorSelection;
  pricing: PricingSettings;
  scope: ProductScope;
  quote: QuoteResult;
  selectedPanel?: Panel;
  selectedColor?: Color;
  selectedSpacer?: SpacerOption;
  selectedHeight?: Height;
  selectedPost?: Post;
  selectedFootingHeight?: FootingHeight;
  selectedFootingMaterial?: FootingMaterial;
  previewPanelCount: number;
  effectiveQuotePerimeterM: number | null;
  footingEnabled: boolean;
  bramaEnabled: boolean;
  bramaElementId: string | null;
  furtkaEnabled: boolean;
  furtkaElementId: string | null;
  furtkaPosition: ConfigurationSvgInput["furtkaPosition"];
  furtkaHingeSide: ConfigurationSvgInput["furtkaHingeSide"];
  footingHeightId: string | null;
  footingMaterialId: string | null;
};

const PAGE_STYLE: React.CSSProperties = {
  width: "794px",
  height: "1123px",
  backgroundColor: "#ffffff",
  padding: "48px",
  boxSizing: "border-box",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#1A1A18",
  overflow: "hidden",
};

const HIDDEN_ROOT_STYLE: React.CSSProperties = {
  position: "fixed",
  left: "-10000px",
  top: 0,
  pointerEvents: "none",
  zIndex: -1,
};

function formatDatePl(date: Date): string {
  return date.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const PdfDocument = forwardRef<HTMLDivElement, PdfDocumentProps>(
  function PdfDocument(props, ref) {
    const {
      catalog,
      selection,
      pricing,
      scope,
      quote,
      selectedPanel,
      selectedColor,
      selectedSpacer,
      selectedHeight,
      selectedPost,
      selectedFootingHeight,
      selectedFootingMaterial,
      previewPanelCount,
      effectiveQuotePerimeterM,
      footingEnabled,
      bramaEnabled,
      bramaElementId,
      furtkaEnabled,
      furtkaElementId,
      furtkaPosition,
      furtkaHingeSide,
      footingHeightId,
      footingMaterialId,
    } = props;

    const svgInput: ConfigurationSvgInput = useMemo(
      () => ({
        catalog,
        selection,
        pricing,
        scope,
        bramaEnabled,
        bramaElementId,
        furtkaEnabled,
        furtkaElementId,
        furtkaPosition,
        furtkaHingeSide,
        footingEnabled,
        footingHeightId,
        footingMaterialId,
      }),
      [
        catalog,
        selection,
        pricing,
        scope,
        bramaEnabled,
        bramaElementId,
        furtkaEnabled,
        furtkaElementId,
        furtkaPosition,
        furtkaHingeSide,
        footingEnabled,
        footingHeightId,
        footingMaterialId,
      ],
    );

    const svgMarkup = useMemo(
      () => buildConfigurationSvg(svgInput),
      [svgInput],
    );

    const configurationRows = useMemo(
      () =>
        [
          ...(scope.fence
            ? [
                { label: "Model panelu", value: selectedPanel?.name },
                { label: "Kolor", value: selectedColor?.name },
                { label: "Wykończenie", value: selectedSpacer?.name },
                { label: "Wysokość", value: selectedHeight?.label },
                {
                  label: "Panele w podglądzie",
                  value: `${previewPanelCount} szt.`,
                },
                { label: "Słupek", value: selectedPost?.name },
                {
                  label: "Podmurówka",
                  value: footingEnabled
                    ? [
                        selectedFootingHeight?.label,
                        selectedFootingMaterial?.name,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Tak"
                    : "Nie",
                },
              ]
            : []),
          ...(scope.gate
            ? [
                {
                  label: "Brama wjazdowa",
                  value:
                    quote.configurationItems.find(
                      (i) => i.label === "Brama wjazdowa",
                    )?.value ?? "Nie",
                },
              ]
            : []),
          ...(scope.wicket
            ? [
                {
                  label: "Furtka",
                  value:
                    quote.configurationItems.find((i) => i.label === "Furtka")
                      ?.value ?? "Nie",
                },
              ]
            : []),
          ...(scope.fence
            ? [
                {
                  label: "Długość z rzutu",
                  value:
                    effectiveQuotePerimeterM != null
                      ? `${effectiveQuotePerimeterM.toFixed(1)} m bieżących`
                      : "—",
                },
                {
                  label: "Stawka za panel",
                  value: `${quote.pricePerPanelNet.toLocaleString("pl-PL")} PLN/panel`,
                },
                {
                  label: "Liczba paneli",
                  value: `${quote.panelUnits} szt.`,
                },
              ]
            : []),
          {
            label: "Wycena orientacyjna",
            value: `${Math.round(quote.totalNet).toLocaleString("pl-PL")} PLN netto`,
          },
        ] as { label: string; value?: string }[],
      [
        scope,
        selectedPanel,
        selectedColor,
        selectedSpacer,
        selectedHeight,
        previewPanelCount,
        selectedPost,
        footingEnabled,
        selectedFootingHeight,
        selectedFootingMaterial,
        quote,
        effectiveQuotePerimeterM,
      ],
    );

    const generatedAt = formatDatePl(new Date());

    return (
      <div ref={ref} style={HIDDEN_ROOT_STYLE} aria-hidden="true">
        <div data-pdf-page style={PAGE_STYLE}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "2px solid #e30311",
              paddingBottom: "16px",
              marginBottom: "24px",
            }}
          >
            <img
              src="/logo.png"
              alt="Ogrodzenia Wielkopolska"
              width={180}
              height={48}
              style={{ height: "48px", width: "auto" }}
            />
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#e30311",
                }}
              >
                Konfiguracja ogrodzenia
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666666" }}>
                {generatedAt}
              </p>
            </div>
          </div>

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A1A18",
            }}
          >
            Podsumowanie konfiguracji
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#666666" }}>
            STAL-POL · Ogrodzenia stalowe
          </p>

          <p
            style={{
              margin: "0 0 12px",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#888888",
            }}
          >
            Twoja konfiguracja
          </p>

          <div style={{ marginBottom: "20px" }}>
            {configurationRows.map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #e5e5e5",
                  padding: "10px 0",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#888888",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1A1A18",
                    textAlign: "right",
                    maxWidth: "55%",
                  }}
                >
                  {value ?? "—"}
                </span>
              </div>
            ))}
          </div>

          {selectedColor && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  border: "1px solid #cccccc",
                  backgroundColor: selectedColor.hex,
                  flexShrink: 0,
                }}
              />
              <div>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>
                  {selectedColor.name}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    color: "#666666",
                  }}
                >
                  {selectedColor.hex}
                </p>
              </div>
            </div>
          )}

          <div
            style={{
              border: "1px solid #dddddd",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#888888",
              }}
            >
              Składniki ceny
            </p>
            {quote.breakdown.map((row, index) => (
              <div
                key={`${row.label}-${index}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "8px",
                  fontSize: "11px",
                  padding: "4px 0",
                }}
              >
                <span style={{ color: "#666666" }}>{row.label}</span>
                {row.amount > 0 ? (
                  <span style={{ fontWeight: 600, color: "#1A1A18" }}>
                    {Math.round(row.amount).toLocaleString("pl-PL")} PLN
                  </span>
                ) : (
                  <span style={{ color: "#999999" }}>{row.value}</span>
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              padding: "16px",
              backgroundColor: "#1A1A18",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#aaaaaa",
              }}
            >
              Wycena orientacyjna
            </span>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>
              {Math.round(quote.totalNet).toLocaleString("pl-PL")}{" "}
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#aaaaaa" }}>
                PLN netto
              </span>
            </span>
          </div>

          <p style={{ margin: 0, fontSize: "10px", color: "#999999", lineHeight: 1.5 }}>
            Niniejsza wycena ma charakter orientacyjny i nie stanowi oferty
            handlowej. Ostateczna cena może ulec zmianie po weryfikacji warunków
            montażu i dostawy.
          </p>
        </div>

        <div data-pdf-page style={PAGE_STYLE}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "2px solid #e30311",
              paddingBottom: "16px",
              marginBottom: "24px",
            }}
          >
            <img
              src="/logo.png"
              alt="Ogrodzenia Wielkopolska"
              width={180}
              height={48}
              style={{ height: "48px", width: "auto" }}
            />
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#e30311",
              }}
            >
              Wizualizacja
            </p>
          </div>

          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "20px",
              fontWeight: 700,
              color: "#1A1A18",
            }}
          >
            Podgląd konfiguracji
          </h2>
          <p style={{ margin: "0 0 32px", fontSize: "13px", color: "#666666" }}>
            {scope.fence
              ? "Wizualizacja skonfigurowanego ogrodzenia"
              : "Wizualizacja skonfigurowanych elementów"}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "480px",
              backgroundColor: "#f5f9fd",
              borderRadius: "12px",
              border: "1px solid #dce6ef",
              padding: "24px",
            }}
          >
            {svgMarkup ? (
              <div
                style={{ width: "100%", maxWidth: "680px" }}
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />
            ) : (
              <p style={{ fontSize: "14px", color: "#888888", textAlign: "center" }}>
                Brak danych do wygenerowania wizualizacji.
              </p>
            )}
          </div>

          {selectedPanel && selectedColor && (
            <div
              style={{
                marginTop: "32px",
                display: "flex",
                flexWrap: "wrap",
                gap: "24px",
                fontSize: "12px",
                color: "#666666",
              }}
            >
              {scope.fence && (
                <span>
                  <strong style={{ color: "#1A1A18" }}>Model:</strong>{" "}
                  {selectedPanel.name}
                </span>
              )}
              <span>
                <strong style={{ color: "#1A1A18" }}>Kolor:</strong>{" "}
                {selectedColor.name}
              </span>
              {selectedHeight && (
                <span>
                  <strong style={{ color: "#1A1A18" }}>Wysokość:</strong>{" "}
                  {selectedHeight.label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);
