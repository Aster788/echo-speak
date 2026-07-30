import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClientRecovery } from "@/components/ClientRecovery";
import { PageShell } from "@/components/PageShell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Echo Speak",
  description: "Learn English expressions from video transcripts",
};

/** Registers before hydration so aborted iOS chunk loads are not missed. */
const clientRecoveryBootScript = `
(function(){
  var KEY='echo-speak:recover-reload';
  var RE=/ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|AbortError|Fetch is aborted|The operation was aborted|Load failed|NetworkError|Failed to fetch|network error/i;
  function ok(msg,name){return RE.test(String(name||'')+' '+String(msg||''));}
  function reloadOnce(){
    try{
      var last=sessionStorage.getItem(KEY);
      var now=Date.now();
      if(last&&now-Number(last)<15000)return;
      sessionStorage.setItem(KEY,String(now));
    }catch(e){}
    location.reload();
  }
  window.addEventListener('error',function(e){
    if(ok(e.message,e.error&&e.error.name))reloadOnce();
  });
  window.addEventListener('unhandledrejection',function(e){
    var r=e.reason;
    var msg=r&&(r.message||String(r));
    var name=r&&r.name;
    if(ok(msg,name)){e.preventDefault();reloadOnce();}
  });
  window.addEventListener('pageshow',function(e){
    if(e.persisted)reloadOnce();
  });
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: clientRecoveryBootScript }} />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-[#222222]/[0.04] text-[#222222] antialiased`}
      >
        <ClientRecovery />
        <PageShell>{children}</PageShell>
      </body>
    </html>
  );
}
