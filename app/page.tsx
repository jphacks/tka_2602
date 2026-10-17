import { InquiryForm } from "@/components/inquiry-form";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <p className="text-sm font-bold tracking-[0.2em] text-orange-700">HISTORY EXPLORATION</p>
      <h1 className="mt-3 text-5xl font-black tracking-tight">レキしるべ</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
        気になる歴史の「なぜ？」を入力すると、AIが根拠と次の探究の手がかりを案内します。
      </p>
      <InquiryForm />
    </main>
  );
}
