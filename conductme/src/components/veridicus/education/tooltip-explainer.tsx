"use client";

import * as React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipExplainerProps {
  term: string;
  explanation: string;
  children?: React.ReactNode;
}

export function TooltipExplainer({ term, explanation, children }: TooltipExplainerProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <span className="inline-flex items-center space-x-1 text-primary hover:underline cursor-help">
              <span>{term}</span>
              <Info className="h-3 w-3" />
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

