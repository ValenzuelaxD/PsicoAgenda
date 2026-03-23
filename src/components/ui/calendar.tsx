"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react@0.487.0";
import { DayPicker } from "react-day-picker@8.10.1";

import { cn } from "./utils";
import { buttonVariants } from "./button";
import useIsMobile from '../../hooks/useIsMobile';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const isMobile = useIsMobile();

  return (
    <DayPicker
      showOutsideDays={isMobile ? false : showOutsideDays}
      numberOfMonths={isMobile ? 1 : undefined}
      className={cn("p-4 w-full", className)}
      classNames={{
        months: "w-full flex",
        month: "flex flex-col gap-4 w-full",
        caption: "flex justify-center pt-1 relative items-center w-full mb-4",
        caption_label: "text-sm font-medium text-slate-200",
        nav: "flex items-center gap-1 w-full justify-between px-2",
        nav_button: cn(
          "size-8 bg-slate-700 border-slate-600 border p-0 opacity-70 hover:opacity-100 text-slate-300 hover:bg-slate-600 rounded-md",
        ),
        nav_button_previous: "order-first",
        nav_button_next: "order-last",
        table: "w-full border-collapse",
        head_row: "grid grid-cols-7 gap-2 mb-2",
        head_cell:
          "text-slate-400 rounded-md font-normal text-xs py-2 text-center",
        row: "grid grid-cols-7 gap-2 w-full mb-2",
        cell: "relative p-0 text-center text-sm h-9",
        day: cn(
          "size-9 p-0 font-normal text-slate-200 hover:bg-slate-700 hover:text-slate-100 rounded-md transition-colors inline-flex items-center justify-center",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-teal-600 aria-selected:text-white",
        day_range_end:
          "day-range-end aria-selected:bg-teal-600 aria-selected:text-white",
        day_selected:
          "bg-teal-600 text-white hover:bg-teal-700 hover:text-white focus:bg-teal-700 focus:text-white font-bold",
        day_today: "bg-slate-700 text-teal-300 font-bold border border-slate-500",
        day_outside:
          "day-outside text-slate-500 opacity-50",
        day_disabled: "text-slate-600 opacity-30 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-teal-500 aria-selected:text-white",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
