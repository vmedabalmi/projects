import { getAllPatents } from "@/lib/patents";
import BrowseClient from "./BrowseClient";

export default function BrowsePage() {
  const patents = getAllPatents();
  return <BrowseClient patents={patents} />;
}
