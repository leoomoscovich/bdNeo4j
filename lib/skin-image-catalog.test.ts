import assert from "node:assert/strict";
import test from "node:test";
import { buildSkinImageMap } from "./skin-image-catalog";

test("matches local skin names to ByMykel skin images by exact name", () => {
  const imageMap = buildSkinImageMap(
    ["AK-47 | Redline", "AWP | Asiimov"],
    [
      {
        name: "AK-47 | Redline",
        image: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/ak_redline.png",
      },
      {
        name: "AWP | Asiimov",
        image: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/awp_asiimov.png",
      },
    ],
  );

  assert.equal(
    imageMap.get("AK-47 | Redline"),
    "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/ak_redline.png",
  );
  assert.equal(
    imageMap.get("AWP | Asiimov"),
    "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/awp_asiimov.png",
  );
});

test("prefers base skin names over wear-specific market hash names", () => {
  const imageMap = buildSkinImageMap(
    ["M4A1-S | Printstream"],
    [
      {
        name: "M4A1-S | Printstream",
        market_hash_name: "M4A1-S | Printstream (Field-Tested)",
        image: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/m4_printstream_base.png",
      },
      {
        name: "M4A1-S | Printstream (Field-Tested)",
        market_hash_name: "M4A1-S | Printstream (Field-Tested)",
        image: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/m4_printstream_wear.png",
      },
    ],
  );

  assert.equal(
    imageMap.get("M4A1-S | Printstream"),
    "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/m4_printstream_base.png",
  );
});
