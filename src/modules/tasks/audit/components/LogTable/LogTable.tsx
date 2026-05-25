"use client";

import React from "react";
import { Trash2, AlertCircle } from "lucide-react";
import { Log } from "../../../types/index";
import { useTheme } from "@/theme/ThemeProvider";

interface LogTableProps {
  filteredLogs: Log[];
  deleteLog: (id: string | number) => void;
  resetFilters: () => void;
}

export default function LogTable({
  filteredLogs,
  deleteLog,
  resetFilters,
}: LogTableProps) {
  const { isDarkMode } = useTheme();

  const containerStyles = isDarkMode
    ? `
      bg-black/[0.72]
      border-white/[0.05]
      ring-1 ring-white/[0.03]
      shadow-[0_14px_40px_rgba(0,0,0,0.18)]
    `
    : `
      bg-white/[0.78]
      border-black/[0.04]
      shadow-[0_10px_35px_rgba(15,23,42,0.05)]
    `;

  const headerStyles = isDarkMode
    ? `
      bg-black/[0.78]
      border-white/[0.04]
    `
    : `
      bg-white/[0.82]
      border-black/[0.04]
    `;

  const footerStyles = isDarkMode
    ? `
      bg-black/[0.45]
      border-white/[0.04]
    `
    : `
      bg-white/[0.7]
      border-black/[0.04]
    `;

  return (
    <div
      className={`
        w-full
        border
        rounded-[1.7rem]
        overflow-hidden
        flex flex-col
        max-h-[600px]
        transition-all duration-300
        backdrop-blur-[24px]
        ${containerStyles}
      `}
    >
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          
          {/* HEADER */}
          <thead
            className={`
              sticky top-0 z-20
              border-b
              backdrop-blur-[24px]
              transition-colors
              ${headerStyles}
            `}
          >
            <tr>
              {[
                "Sr.No",
                "Time",
                "Event",
                "Objective",
                "Payload",
              ].map((item, i) => (
                <th
                  key={i}
                  className={`
                    px-4 py-3
                    text-[10px]
                    uppercase
                    tracking-[0.14em]
                    font-medium
                    ${
                      i === 0
                        ? "w-12 text-center"
                        : ""
                    }
                    ${
                      isDarkMode
                        ? "text-white/42"
                        : "text-black/42"
                    }
                  `}
                >
                  {item}
                </th>
              ))}

              <th className="px-4 py-3" />
            </tr>
          </thead>

          {/* BODY */}
          <tbody
            className={`divide-y ${
              isDarkMode
                ? "divide-white/[0.04]"
                : "divide-black/[0.04]"
            }`}
          >
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, index) => {
                const rowId =
                  log.id ||
                  `${log.time}-${index}`;

                const badgeClass =
                  log.action === "DELETE"
                    ? `
                      bg-red-500/10
                      text-red-400
                      border-red-500/10
                    `
                    : log.action === "CREATE"
                    ? `
                      bg-emerald-500/10
                      text-emerald-400
                      border-emerald-500/10
                    `
                    : `
                      bg-orange-500/10
                      text-orange-400
                      border-orange-500/10
                    `;

                return (
                  <tr
                    key={rowId}
                    className={`
                      group
                      transition-all duration-200
                      ${
                        isDarkMode
                          ? "hover:bg-white/[0.035]"
                          : "hover:bg-black/[0.02]"
                      }
                    `}
                  >
                    {/* SERIAL */}
                    <td
                      className={`
                        px-4 py-3
                        text-[12px]
                        text-center
                        ${
                          isDarkMode
                            ? "text-white/38"
                            : "text-black/38"
                        }
                      `}
                    >
                      {filteredLogs.length -
                        index}
                    </td>

                    {/* TIME */}
                    <td
                      className={`
                        px-4 py-3
                        text-[12px]
                        whitespace-nowrap
                        ${
                          isDarkMode
                            ? "text-white/50"
                            : "text-black/50"
                        }
                      `}
                    >
                      {new Date(
                        log.time
                      ).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* EVENT */}
                    <td className="px-4 py-3">
                      <span
                        className={`
                          inline-flex
                          items-center
                          rounded-[0.8rem]
                          border
                          px-2.5 py-1
                          text-[10px]
                          uppercase
                          tracking-[0.12em]
                          font-medium
                          ${badgeClass}
                        `}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* OBJECTIVE */}
                    <td
                      className={`
                        px-4 py-3
                        text-[13px]
                        max-w-[220px]
                        truncate
                        tracking-[-0.01em]
                        ${
                          isDarkMode
                            ? "text-white/88"
                            : "text-black/80"
                        }
                      `}
                      style={{
                        fontWeight: 500,
                      }}
                      title={log.name}
                    >
                      {log.name}
                    </td>

                    {/* PAYLOAD */}
                    <td
                      className={`
                        px-4 py-3
                        text-[12px]
                        max-w-sm
                        truncate
                        ${
                          isDarkMode
                            ? "text-white/45"
                            : "text-black/45"
                        }
                      `}
                      title={log.detail}
                    >
                      {log.detail}
                    </td>

                    {/* DELETE */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Delete this log entry?"
                            )
                          ) {
                            deleteLog(rowId);
                          }
                        }}
                        title="Delete entry"
                        className={`
                          p-2
                          rounded-[0.7rem]
                          transition-all duration-200
                          ${
                            isDarkMode
                              ? `
                                text-white/28
                                hover:text-red-400
                                hover:bg-red-500/10
                              `
                              : `
                                text-black/28
                                hover:text-red-500
                                hover:bg-red-500/10
                              `
                          }
                        `}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="p-24 text-center"
                >
                  <div className="flex flex-col items-center gap-4">
                    <AlertCircle
                      size={34}
                      className={
                        isDarkMode
                          ? "text-white/18"
                          : "text-black/18"
                      }
                    />

                    <div>
                      <p
                        className={`text-[14px] ${
                          isDarkMode
                            ? "text-white/70"
                            : "text-black/70"
                        }`}
                        style={{
                          fontWeight: 500,
                        }}
                      >
                        No events recorded
                      </p>

                      <p
                        className={`text-[12px] mt-1 ${
                          isDarkMode
                            ? "text-white/40"
                            : "text-black/40"
                        }`}
                      >
                        Adjust filters or
                        continue activity
                      </p>
                    </div>

                    <button
                      onClick={resetFilters}
                      className="
                        mt-1
                        rounded-[1rem]
                        bg-orange-500/10
                        hover:bg-orange-500/16
                        text-orange-500
                        px-4 py-2
                        text-[12px]
                        transition-colors
                      "
                      style={{
                        fontWeight: 500,
                      }}
                    >
                      Reset Filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div
        className={`
          px-5 py-3
          border-t
          flex justify-between items-center
          transition-colors
          ${footerStyles}
        `}
      >
        <span
          className={`text-[10px] uppercase tracking-[0.14em] ${
            isDarkMode
              ? "text-white/32"
              : "text-black/32"
          }`}
        >
          Active Engine: v1.6.4
        </span>

        <span
          className={`text-[10px] uppercase tracking-[0.14em] ${
            isDarkMode
              ? "text-white/32"
              : "text-black/32"
          }`}
        >
          {filteredLogs.length} Events Listed
        </span>
      </div>
    </div>
  );
}