import { describe, expect, it } from "vitest";
import {
  splitEmbeddedPhonetic,
  splitPhraseAndPhonetic,
} from "@/lib/feishu-phonetic";

describe("splitEmbeddedPhonetic", () => {
  it("splits trailing slash IPA", () => {
    expect(splitEmbeddedPhonetic("ginormous /dʒaɪˈnɔːrməs/")).toEqual({
      lemma: "ginormous",
      phonetic: "/dʒaɪˈnɔːrməs/",
    });
  });

  it("splits bracket IPA", () => {
    expect(splitEmbeddedPhonetic("croissant [ˈkroasaːnt]")).toEqual({
      lemma: "croissant",
      phonetic: "[ˈkroasaːnt]",
    });
  });

  it("keeps mid-phrase words around IPA", () => {
    expect(splitEmbeddedPhonetic("be bombarded /bɑːmˈbɑːrdɪd/ by")).toEqual({
      lemma: "be bombarded by",
      phonetic: "/bɑːmˈbɑːrdɪd/",
    });
  });

  it("does not treat slash alternatives as IPA", () => {
    expect(splitEmbeddedPhonetic("get to/gotta")).toEqual({
      lemma: "get to/gotta",
      phonetic: null,
    });
  });
});

describe("splitPhraseAndPhonetic", () => {
  it("prefers stored phonetic column while still stripping lemma", () => {
    expect(
      splitPhraseAndPhonetic("ginormous /dʒaɪˈnɔːrməs/", "/custom/")
    ).toEqual({
      lemma: "ginormous",
      phonetic: "/custom/",
    });
  });

  it("falls back to embedded parse when phonetic null", () => {
    expect(splitPhraseAndPhonetic("platonic /pləˈtɒnɪk/", null)).toEqual({
      lemma: "platonic",
      phonetic: "/pləˈtɒnɪk/",
    });
  });
});
