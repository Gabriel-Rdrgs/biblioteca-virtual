import type { Metadata } from "next";
import { ReviewLauncher } from "@/components/anatomia/review-launcher";
import { allTrainableMuscles } from "@/lib/data/anatomia";

export const metadata: Metadata = {
  title: "Revisar músculos",
  description: "Os músculos que voltaram hoje na revisão espaçada, de memória.",
};

export default function RevisarPage() {
  return (
    <>
      <h1 className="sr-only">Revisar músculos</h1>
      <ReviewLauncher muscles={allTrainableMuscles()} />
    </>
  );
}
