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
      className={cn(isMobile ? 'p-2' : 'p-3', className)}
      classNames={{
        months: isMobile ? "flex flex-col gap-2" : "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium text-slate-200",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-slate-700 border-slate-600 p-0 opacity-70 hover:opacity-100 text-slate-300 hover:bg-slate-600",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-slate-400 rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-teal-600 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal text-slate-300 aria-selected:opacity-100 hover:bg-slate-700 hover:text-slate-100",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-teal-600 aria-selected:text-white",
        day_range_end:
          "day-range-end aria-selected:bg-teal-600 aria-selected:text-white",
        day_selected:
          "bg-teal-600 text-white hover:bg-teal-700 hover:text-white focus:bg-teal-700 focus:text-white",
        day_today: "bg-slate-700 text-teal-300 font-bold",
        day_outside:
          "day-outside text-slate-500 aria-selected:text-slate-500",
        day_disabled: "text-slate-600 opacity-40 cursor-not-allowed",
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
