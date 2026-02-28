"use client";

import React from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

interface SwaggerProps {
  url?: string;
  spec?: object;
}

const SwaggerWrapper = ({ url, spec }: SwaggerProps) => {
  return (
    <div className="swagger-container">
      {url ? <SwaggerUI url={url} /> : <SwaggerUI spec={spec} />}
      <style jsx global>{`
        /* Ajuste opcional para que se vea bien en fondos oscuros si usas Tailwind Dark Mode */
        .swagger-ui {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default SwaggerWrapper;
