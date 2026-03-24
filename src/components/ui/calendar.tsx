"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react@0.487.0";
import { DayPicker } from "react-day-picker@8.10.1";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      numberOfMonths={1}
      className={cn("p-2 sm:p-3", className)}
      classNames={{
        months: "flex w-full justify-center",
        month: "space-y-3 w-full",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold text-slate-100",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-slate-700/80 border-slate-600 p-0 opacity-80 hover:opacity-100 text-slate-200 hover:bg-slate-600"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full table-fixed border-collapse",
        head_row: "h-9",
        head_cell:
          "text-slate-400 font-normal text-[0.8rem] text-center align-middle",
        row: "h-12",
        cell: "h-12 p-1 text-center align-middle relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-800/40 [&:has([aria-selected])]:bg-slate-700/30 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-full w-full mx-0 p-0 text-base font-normal text-slate-200 rounded-lg aria-selected:opacity-100 hover:bg-slate-700 hover:text-white"
        ),
        day_range_start:
          "day-range-start rounded-l-md aria-selected:bg-teal-600 aria-selected:text-white",
        day_range_end:
          "day-range-end rounded-r-md aria-selected:bg-teal-600 aria-selected:text-white",
        day_selected:
          "bg-teal-600 text-white hover:bg-teal-700 focus:bg-teal-700 font-bold",
        day_today: "bg-slate-700 text-teal-300 border border-slate-500",
        day_outside: "day-outside text-slate-500 opacity-40 aria-selected:bg-slate-700/30 aria-selected:text-slate-500 aria-selected:opacity-30",
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
