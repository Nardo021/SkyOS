import { useMemo } from "react";

import type { AirportLabel, RunwaySegment } from "@skyos/types";

import {

  resolveCeilingUvFromSkyDir,

  skyDirToAzEl,

  skyToCeilingPercent,

} from "./ceiling";



const MAX_RUNWAY_LINES = 150;



function formatRunwayIdent(ident?: string): string | null {

  const s = ident?.trim();

  if (!s) return null;

  return s;

}



function labelAlongRunway(

  p1: { u: number; v: number },

  p2: { u: number; v: number },

  end: "le" | "he",

  offset = 2.2,

) {

  const dx = p2.u - p1.u;

  const dy = p2.v - p1.v;

  const len = Math.hypot(dx, dy) || 1;

  const base = end === "le" ? p1 : p2;

  const sign = end === "le" ? -1 : 1;

  return {

    u: base.u + (sign * dx * offset) / len,

    v: base.v + (sign * dy * offset) / len,

  };

}



export interface CeilingRunwaySvgProps {

  runways: RunwaySegment[];

  airportLabels: AirportLabel[];

}



export function useCeilingRunwayGraphics(

  runways: RunwaySegment[],

  airportLabels: AirportLabel[],

) {

  return useMemo(() => {

    const lines = runways.slice(0, MAX_RUNWAY_LINES).map((r) => {

      const p1 = resolveCeilingUvFromSkyDir(r.x1, r.y1, r.z1);

      const p2 = resolveCeilingUvFromSkyDir(r.x2, r.y2, r.z2);

      const leLabel = formatRunwayIdent(r.leIdent);

      const heLabel = formatRunwayIdent(r.heIdent);

      return {

        id: r.id,

        p1,

        p2,

        leLabel,

        heLabel,

        leText: leLabel ? labelAlongRunway(p1, p2, "le") : null,

        heText: heLabel ? labelAlongRunway(p1, p2, "he") : null,

      };

    });



    const seen = new Set<string>();

    const airports = airportLabels

      .filter((l) => {

        if (seen.has(l.icao)) return false;

        seen.add(l.icao);

        return true;

      })

      .sort(

        (a, b) =>

          (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity),

      )

      .map((l) => {

        const { azimuthDeg, elevationDeg } = skyDirToAzEl(l.x, l.y, l.z);

        const code = skyToCeilingPercent(

          azimuthDeg,

          Math.max(0, elevationDeg - 2.8),

        );

        const codeText = l.iata?.trim()

          ? `${l.icao}\n${l.iata}`

          : l.icao;

        return { icao: l.icao, code, codeText };

      });



    return { lines, airports };

  }, [runways, airportLabels]);

}



export function CeilingRunwaySvg({

  runways,

  airportLabels,

}: CeilingRunwaySvgProps) {

  const { lines, airports } = useCeilingRunwayGraphics(

    runways,

    airportLabels,

  );



  return (

    <>

      {lines.map(({ id, p1, p2, leText, heText, leLabel, heLabel }) => (

        <g key={id}>

          <line

            x1={p1.u}

            y1={p1.v}

            x2={p2.u}

            y2={p2.v}

            stroke="#e2e8f0"

            strokeOpacity={0.95}

            strokeWidth={1.35}

            strokeLinecap="round"

          />

          {leLabel && leText ? (

            <text

              x={leText.u}

              y={leText.v}

              textAnchor="middle"

              dominantBaseline="middle"

              fill="#f8fafc"

              fontSize={2.4}

              fontWeight={600}

              fontFamily="ui-monospace, monospace"

              stroke="#000"

              strokeWidth={0.15}

              paintOrder="stroke"

            >

              {leLabel}

            </text>

          ) : null}

          {heLabel && heText ? (

            <text

              x={heText.u}

              y={heText.v}

              textAnchor="middle"

              dominantBaseline="middle"

              fill="#f8fafc"

              fontSize={2.4}

              fontWeight={600}

              fontFamily="ui-monospace, monospace"

              stroke="#000"

              strokeWidth={0.15}

              paintOrder="stroke"

            >

              {heLabel}

            </text>

          ) : null}

        </g>

      ))}

      {airports.map(({ icao, code, codeText }) => (

        <text

          key={`ap-${icao}`}

          x={code.u}

          y={code.v}

          textAnchor="middle"

          dominantBaseline="hanging"

          fill="#94a3b8"

          fontSize={2.6}

          fontWeight={700}

          fontFamily="ui-monospace, monospace"

          stroke="#000"

          strokeWidth={0.12}

          paintOrder="stroke"

        >

          {codeText.split("\n").map((line, i) => (

            <tspan key={i} x={code.u} dy={i === 0 ? 0 : 2.8}>

              {line}

            </tspan>

          ))}

        </text>

      ))}

    </>

  );

}


