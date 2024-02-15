import { NextResponse } from "next/server";
import { Message } from "@/types/message";
import { stack9Chain } from "@/utils/stack9-chain";

export async function POST(request: Request) {
  const body = await request.json();
  const question: string = body.query;
  const history: Message[] = body.history ?? [];

  const res = await stack9Chain.invoke(
    {
      question,
      history,
    },
    {
      configurable: { sessionId: "stack9" },
    }
  );

  const links: string[] = Array.from(new Set([]));

  //   const links: string[] = Array.from(
  //     new Set(
  //       res.sourceDocuments.map(
  //         (document: { metadata: { source: string } }) => document.metadata.source
  //       )
  //     )
  //   );
  return NextResponse.json({
    role: "assistant",
    content: res,
    links: links,
  });
}
