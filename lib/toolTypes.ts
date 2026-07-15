export interface Answers {
  situation: string;
  story: string;
  origin: string;
  want: string;
}

export interface SessionRec {
  name: string;
  url: string;
}

export interface ReadingSectionData {
  heading: string;
  body: string;
}

export interface ReadingResultData {
  sections: ReadingSectionData[];
  sessions: SessionRec[];
  toolkitFit: boolean;
}

export type Stage =
  | "email"
  | "already-used"
  | "questions"
  | "loading-hypotheses"
  | "hypotheses"
  | "loading-reading"
  | "reading";
