"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/icons";

type Mission = {
  id: string;
  label: string;
  question: string;
  options: [string, string];
  supportedOption: number;
  clue: string;
  sourceId: string;
  sourceLabel: string;
  ask: string;
  discovery: string;
};

// These short clues use the same documented sources as the full source reader.
// They are teaching summaries, not quotations or reconstructions of inner thoughts.
const missions: Mission[] = [
  {
    id: "letter",
    label: "7日後の手紙",
    question: "信長を襲った7日後。光秀は、手紙で何をした？",
    options: ["事件を起こした理由を、すべて告白した", "細川親子に、自分への協力を頼んだ"],
    supportedOption: 1,
    clue: "6月9日の覚書は、細川藤孝（ふじたか）・忠興（ただおき）に協力を求めた文書。仲間を誘うための言葉かもしれないから、事件前の本音をすべて明かした告白とは言い切れないんだ。",
    sourceId: "honnoji-akechi",
    sourceLabel: "明智光秀の覚書",
    ask: "光秀は事件のあと、だれを仲間に誘ったの？",
    discovery: "事件の7日後の覚書で、光秀は細川藤孝・忠興に協力を求めていた。事件前の本音をすべて明かした文書とは言い切れない。",
  },
  {
    id: "place",
    label: "お寺の場所",
    question: "今の本能寺に行けば、事件と同じ場所に立てる？",
    options: ["同じ名前でも、場所は変わったかも", "同じ名前だから、場所も同じはず"],
    supportedOption: 0,
    clue: "今の本能寺は、事件のあとに移されたお寺。事件当時の場所は「本能寺跡」として別にあるので、地図で2つの場所をくらべるのも調査なんだ。",
    sourceId: "honnoji-site",
    sourceLabel: "京都市の本能寺跡の解説",
    ask: "今の本能寺に行けば、事件の場所がわかる？",
    discovery: "現在の本能寺は事件のあとに移転している。同じ名前のお寺でも、事件当時の場所とは区別する必要がある。",
  },
  {
    id: "reputation",
    label: "信長のうわさ",
    question: "若い信長は「うつけ」と呼ばれた。評判だけで、力はわかる？",
    options: ["評判どおり、何もできなかったはず", "その後に何をしたかも見てみたい"],
    supportedOption: 1,
    clue: "若い信長には、父の葬式できまり外れのふるまいをしたという話が伝わり、のちには桶狭間（おけはざま）の戦いの勝利で名を知られた。「うつけ」という評判だけで、本当に頭が悪かったとも、全部わざとだったとも決められないよ。",
    sourceId: "honnoji-nobunaga-youth",
    sourceLabel: "名古屋市の若い信長の解説",
    ask: "織田信長ってだれ？",
    discovery: "若い信長には「うつけ」の逸話が伝わるが、それだけで頭の良し悪しや計画した演技とは決められない。のちには桶狭間の勝利で名を知られた。",
  },
];

type CuriosityMissionProps = {
  unitId: string;
  onSource: (id: string) => void;
  onAsk: (question: string, sourceId: string) => void;
  onSaveClue: (text: string, sourceIds: string[]) => void;
  isLoading: boolean;
  savedClues: string[];
};

export function CuriosityMission({ unitId, onSource, onAsk, onSaveClue, isLoading, savedClues }: CuriosityMissionProps) {
  const titleId = useId();
  const questionId = useId();
  const [missionId, setMissionId] = useState(missions[0].id);
  const [guesses, setGuesses] = useState<Record<string, number>>({});
  const mission = missions.find((item) => item.id === missionId) ?? missions[0];
  const guess = guesses[mission.id];
  const revealed = guess !== undefined;
  const saved = savedClues.includes(mission.discovery);

  if (unitId !== "honnoji") return null;

  return (
    <section className="panel curiosity-mission" aria-labelledby={titleId}>
      <div className="mission-heading">
        <span className="mission-compass"><Icon name="compass" size={25}/></span>
        <div><h2 id={titleId}>まずは、ひとつ予想してみよう</h2><p>知らなくても、えらべばOK。気になった謎から始めよう。</p></div>
      </div>
      <div className="mission-tabs" role="group" aria-label="予想する謎を選ぶ">
        {missions.map((item) => <button type="button" key={item.id} aria-pressed={item.id === mission.id} onClick={() => setMissionId(item.id)}>{item.label}{guesses[item.id] !== undefined && <Icon name="check" size={14}/>}</button>)}
      </div>
      <div className="mission-challenge">
        <h3 id={questionId}>{mission.question}</h3>
        <div className="mission-options" role="group" aria-labelledby={questionId}>
          {mission.options.map((option, index) => <button type="button" key={`${mission.id}-${index}`} aria-pressed={guess === index} disabled={revealed} onClick={() => setGuesses((current) => ({ ...current, [mission.id]: index }))}><span aria-hidden="true">{index === 0 ? "A" : "B"}</span>{option}</button>)}
        </div>
      </div>
      {revealed && <div className="mission-reveal" key={mission.id}>
        <div role="status"><h4><Icon name="lightbulb" size={19}/>{guess === mission.supportedOption ? "その予想につながる手がかりがあるよ。" : "じつは、こんな手がかりがあるよ。"}</h4><p>{mission.clue}</p><span className="mission-source-label">もとにした資料：{mission.sourceLabel}</span></div>
        <div className="mission-actions">
          <button type="button" onClick={() => onSource(mission.sourceId)}><Icon name="book" size={16}/>資料でたしかめる</button>
          <button type="button" onClick={() => onAsk(mission.ask, mission.sourceId)} disabled={isLoading}><Icon name="message" size={16}/>{isLoading ? "AIの回答を待っています…" : "AIに聞いてみる"}</button>
          <button type="button" className="mission-save" onClick={() => onSaveClue(mission.discovery, [mission.sourceId])} disabled={saved}><Icon name={saved ? "check" : "plus"} size={16}/>{saved ? "ノートの下書きに追加済み" : "発見をノートの下書きに追加"}</button>
        </div>
        {saved && <p className="mission-save-hint" role="status">画面下の「探偵ノートに保存」で、この発見を残せます。</p>}
      </div>}
    </section>
  );
}
