'use client'

import { useState, useMemo } from 'react'
import { ReactFile } from '@/types/project'
import { Button } from '@/components/ui/button'
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  FileText,
  FileJson,
  Folder,
  FolderOpen,
  Plus,
  MoreVertical,
  File,
  Edit,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FileExplorerProps {
  files: ReactFile[]
  onFileSelect: (file: ReactFile) => void
  selectedFileId?: string
  onNewFile: () => void
  onNewFolder: () => void
  onRenameFile: (file: ReactFile) => void
  onDeleteFile: (file: ReactFile) => void
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  file?: ReactFile
  children: FileNode[]
}

export function FileExplorer({
  files,
  onFileSelect,
  selectedFileId,
  onNewFile,
  onNewFolder,
  onRenameFile,
  onDeleteFile
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Construir árvore de arquivos
  const tree = useMemo(() => {
    const root: FileNode = {
      name: 'root',
      path: '',
      type: 'folder',
      children: []
    }

    files.forEach(file => {
      const parts = file.path.split('/')
      let current = root

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // Último item é um arquivo
          current.children.push({
            name: part,
            path: file.path,
            type: 'file',
            file,
            children: []
          })
        } else {
          // Pasta
          let folder = current.children.find(child => child.name === part && child.type === 'folder')
          if (!folder) {
            folder = {
              name: part,
              path: parts.slice(0, index + 1).join('/'),
              type: 'folder',
              children: []
            }
            current.children.push(folder)
          }
          current = folder
        }
      })
    })

    return root.children
  }, [files])

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath)
    } else {
      newExpanded.add(folderPath)
    }
    setExpandedFolders(newExpanded)
  }

  const getFileIcon = (fileType: ReactFile['file_type']) => {
    switch (fileType) {
      case 'jsx':
      case 'js':
        return <FileCode className="w-4 h-4 text-yellow-500" />
      case 'css':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'json':
        return <FileJson className="w-4 h-4 text-green-500" />
      case 'md':
        return <File className="w-4 h-4" />
      default:
        return <File className="w-4 h-4" />
    }
  }

  const renderNode = (node: FileNode, level: number = 0) => {
    if (node.type === 'folder') {
      const isExpanded = expandedFolders.has(node.path)
      return (
        <div key={node.path}>
          <div
            className="flex items-center gap-2 px-2 py-1 hover:bg-accent rounded cursor-pointer group"
            style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500" />
            )}
            <span className="flex-1 text-sm font-medium">{node.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onNewFile}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Arquivo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onNewFolder}>
                  <Folder className="w-4 h-4 mr-2" />
                  Nova Pasta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {isExpanded && node.children.map(child => renderNode(child, level + 1))}
        </div>
      )
    } else {
      const isSelected = selectedFileId === node.file?.id
      return (
        <div
          key={node.path}
          className={`
            flex items-center gap-2 px-2 py-1 rounded cursor-pointer group
            ${isSelected ? 'bg-accent' : 'hover:bg-accent'}
          `}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={() => node.file && onFileSelect(node.file)}
        >
          <div className="w-4 h-4" /> {/* Spacer for alignment */}
          {getFileIcon(node.file!.file_type)}
          <span className="flex-1 text-sm truncate">{node.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => node.file && onRenameFile(node.file)}>
                <Edit className="w-4 h-4 mr-2" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => node.file && onDeleteFile(node.file)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  }

  return (
    <div className="h-full flex flex-col bg-card border-r">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">Explorador</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onNewFile}
            title="Novo arquivo"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onNewFolder}
            title="Nova pasta"
          >
            <Folder className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {tree.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            <p>Nenhum arquivo</p>
            <p className="text-xs mt-2">Clique no + para criar um arquivo</p>
          </div>
        ) : (
          tree.map(node => renderNode(node))
        )}
      </div>
    </div>
  )
}

