import React from 'react';
import { File, Folder, Image, Film, FileText, Music, FileQuestion, Table2, Presentation } from 'lucide-react';
import { FileType } from '../types';

interface IconHelperProps {
  type: FileType;
  className?: string;
}

export const IconHelper: React.FC<IconHelperProps> = ({ type, className = "w-6 h-6" }) => {
  switch (type) {
    case FileType.FOLDER:
      return <Folder className={`${className} text-slate-600 fill-slate-600/20`} />;
    case FileType.IMAGE:
      return <Image className={`${className} text-red-500`} />;
    case FileType.VIDEO:
      return <Film className={`${className} text-red-600`} />;
    case FileType.PDF:
      return <FileText className={`${className} text-red-500`} />;
    case FileType.DOC:
    case FileType.GDOC:
      return <FileText className={`${className} text-blue-600`} />;
    case FileType.GSHEET:
      return <Table2 className={`${className} text-green-600`} />;
    case FileType.GSLIDE:
      return <Presentation className={`${className} text-yellow-500`} />;
    case FileType.AUDIO:
      return <Music className={`${className} text-purple-500`} />;
    default:
      return <File className={`${className} text-gray-500`} />;
  }
};
