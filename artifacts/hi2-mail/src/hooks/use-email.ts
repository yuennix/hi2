import { useState, useEffect, useCallback } from "react";
import { useGenerateEmail } from "@workspace/api-client-react";

export function useEmailState() {
  const [email, setEmail] = useState<string | null>(() => {
    return localStorage.getItem("hi2_email");
  });

  const { mutate: generateEmail, isPending: isGenerating } = useGenerateEmail();

  const handleGenerate = useCallback(() => {
    generateEmail(undefined, {
      onSuccess: (data) => {
        setEmail(data.email);
        localStorage.setItem("hi2_email", data.email);
      },
    });
  }, [generateEmail]);

  useEffect(() => {
    if (!email) {
      handleGenerate();
    }
  }, [email, handleGenerate]);

  return {
    email,
    isGenerating,
    generateNew: handleGenerate
  };
}
