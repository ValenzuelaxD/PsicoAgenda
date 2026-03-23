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
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full mb-4",
        caption_label: "text-sm font-medium text-slate-200",
        nav: "flex items-center gap-1 absolute w-full justify-between px-0",
        nav_button: cn(
          "size-8 bg-slate-700 border border-slate-600 p-0 opacity-70 hover:opacity-100 text-slate-300 hover:bg-slate-600 rounded-md",
        ),
        nav_button_previous: "left-0",
        nav_button_next: "right-0",
        table: "w-full border-collapse",
        head_row: "grid grid-cols-7 gap-2 mb-2",
        head_cell:
          "text-slate-400 font-normal text-xs py-2 text-center uppercase tracking-wider",
        row: "grid grid-cols-7 gap-2 w-full mb-1",
        cell: "h-10 w-10 relative p-0",
        day: cn(
          "size-10 p-0 font-normal text-slate-200 rounded-md transition-all",
          "hover:bg-slate-700 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
        ),
        day_range_start:
          "day-range-start rounded-l-md aria-selected:bg-teal-600 aria-selected:text-white",
        day_range_end:
          "day-range-end rounded-r-md aria-selected:bg-teal-600 aria-selected:text-white",
        day_selected:
          "bg-teal-600 text-white hover:bg-teal-700 focus:bg-teal-700 font-bold",
        day_today: "bg-slate-700 text-teal-300 font-bold border border-slate-500",
        day_outside: "text-slate-500 opacity-40",
        day_disabled: "text-slate-600 opacity-20 cursor-not-allowed",
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
