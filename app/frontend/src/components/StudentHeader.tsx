import { User } from "lucide-react";
import type { AlunoHeaderData } from "../types/alunoHeader";

interface StudentHeaderProps {
  header: AlunoHeaderData;
}

export function StudentHeader({ header }: StudentHeaderProps) {
  const hasPhoto = Boolean(header.fotoUrl);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <div className="flex-shrink-0">
          {hasPhoto ? (
            <img
              src={header.fotoUrl as string}
              alt={`Foto de ${header.nome}`}
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2 truncate">
            {header.nome}
          </h1>

          <div className="space-y-1 mb-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Matrícula:</span>{" "}
              {header.matricula}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Curso:</span>{" "}
              {header.curso}
            </p>
          </div>

          {header.tagsDificuldade && header.tagsDificuldade.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {header.tagsDificuldade.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
