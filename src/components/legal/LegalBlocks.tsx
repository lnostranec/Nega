import { Fragment } from "react";
import { siteUrl } from "@/lib/site-url";
import type { LegalBlock } from "@/lib/legal/policies";

const LINK_PATTERN = /(https?:\/\/[^\s«»()]+|[\w.+-]+@[\w-]+\.[A-Za-z]{2,})/g;

function renderText(rawText: string) {
  const text = rawText.split("{{SITE}}").join(siteUrl());

  return text.split(LINK_PATTERN).map((part, index) => {
    if (!part) return null;

    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-[#260402] underline underline-offset-2"
        >
          {part}
        </a>
      );
    }

    if (part.includes("@")) {
      return (
        <a
          key={index}
          href={`mailto:${part}`}
          className="text-[#260402] underline underline-offset-2"
        >
          {part}
        </a>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}

/** Текст юридических документов: абзацы, списки и ссылки на почту/сайты. */
export function LegalBlocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.kind === "list") {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderText(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.kind === "lead") {
          return (
            <p key={index} className="font-medium text-[#260402]">
              {renderText(block.text)}
            </p>
          );
        }

        return <p key={index}>{renderText(block.text)}</p>;
      })}
    </>
  );
}
