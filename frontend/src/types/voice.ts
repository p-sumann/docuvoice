export interface SuggestedQuestion {
  id: string;
  text: string;
  category: "analysis" | "comparison" | "summary" | "general";
}
