"use client";

import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { TriangleAlertIcon } from "lucide-react";

type PropsErroPDF = {
  mensagem: string;
};

export function BlocoErroPDF({ mensagem }: PropsErroPDF) {
  return (
    <Field className="sm:col-span-2 lg:col-span-3">
      <Alert
        variant="destructive"
        className="border-red-500/20 bg-red-500/5 font-bold"
      >
        <TriangleAlertIcon className="size-4" />
        {mensagem}
      </Alert>
    </Field>
  );
}
