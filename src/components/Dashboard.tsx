import { useEffect, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../lib/supabase'
import {
  Upload,
  Download,
  Trash2,
  FileText,
  Image,
  LogOut,
  Plus,
  Search,
  ChevronLeft,
  Folder,
  X,
  Check,
  Loader2,
  MoreVertical,
  Eye,
  Copy,
  Share2,
} from 'lucide-react'

interface FileItem {
  id: string
  name: string
  size: number
  mime_type: string
  created_at: string
  path: string
}

interface DashboardProps {
  supabase: any
  user: any
}

export default function Dashboard({ supabase, user }: DashboardProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null)

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-10 h-10 text-green-500" />
    if (mimeType === 'application/pdf') return <FileText className="w-10 h-10 text-red-500" />
    return <FileText className="w-10 h-10 text-gray-400" />
  }

  const isImage = (mimeType: string) => mimeType.startsWith('image/')
  const isPDF = (mimeType: string) => mimeType === 'application/pdf'

  const loadFiles = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (err: any) {
      console.error('Error loading files:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, user.id])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const handleUpload = async (acceptedFiles: File[]) => {
    setUploading(true)
    try {
      for (const file of acceptedFiles) {
        const filePath = `${user.id}/${Date.now()}-${file.name}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(filePath)

        // Save metadata to database
        const { error: dbError } = await supabase
          .from('files')
          .insert({
            user_id: user.id,
            name: file.name,
            size: file.size,
            mime_type: file.type,
            path: filePath,
            public_url: publicUrl,
          })

        if (dbError) throw dbError
      }
      loadFiles()
    } catch (err: any) {
      console.error('Upload error:', err)
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: uploading,
  })

  const handleDownload = async (file: FileItem) => {
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .download(file.path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Download error:', err)
      alert('Download failed: ' + err.message)
    }
  }

  const handleDelete = async (fileId: string, filePath: string) => {
    if (!confirm('Delete this file?')) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)

      if (dbError) throw dbError

      loadFiles()
      setSelectedFiles([])
    } catch (err: any) {
      console.error('Delete error:', err)
      alert('Delete failed: ' + err.message)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, file })
  }

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  return (
    <div className="min-h-screen bg-gray-50" {...getRootProps()}>
      <input {...getInputProps()} />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v4a2 2 0 002 2h14a2 2 0 002-2V7m-5 10v-5m0 0a2 2 0 012-2h4a2 2 0 012 2v5m-6-5h6" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">File Vault</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                />
              </div>

              {/* Upload Button */}
              <button
                onClick={() => document.getElementById('file-input')?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
              </button>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,image/*"
                onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))}
                className="hidden"
              />

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{filteredFiles.length} of {files.length} files • {formatSize(totalSize)} total</span>
            {isDragActive && (
              <span className="text-blue-600 font-medium flex items-center gap-1">
                <Upload className="w-4 h-4" /> Drop files here...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Drop Zone Hint */}
      {isDragActive && (
        <div className="fixed inset-0 bg-blue-600/10 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-2xl p-12 text-center shadow-xl pointer-events-auto">
            <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Drop files here</h2>
            <p className="text-gray-500 mt-2">PDFs and images up to 50MB each</p>
          </div>
        </div>
      )}

      {/* File Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-16">
            <div className={isDragActive ? 'dropzone-active' : ''} {...getRootProps()}>
              <input {...getInputProps()} />
              <div className="inline-flex flex-col items-center p-12 border-2 border-dashed border-gray-300 rounded-2xl bg-white hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-lg text-gray-600">Drag & drop PDFs or images here</p>
                <p className="text-sm text-gray-400 mt-1">or click to browse</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="file-preview group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all"
                onContextMenu={(e) => handleContextMenu(e, file)}
              >
                {/* File Preview */}
                <div className="aspect-square flex items-center justify-center bg-gray-50 relative">
                  {isImage(file.mime_type) ? (
                    <img
                      src={file.public_url}
                      alt={file.name}
                      className="max-w-full max-h-full object-contain p-2"
                      loading="lazy"
                    />
                  ) : isPDF(file.mime_type) ? (
                    <FileText className="w-16 h-16 text-red-500" />
                  ) : (
                    <FileText className="w-16 h-16 text-gray-400" />
                  )}

                  {/* Selection checkbox */}
                  <div className="absolute top-2 right-2">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        if (e.target.checked) {
                          setSelectedFiles([...selectedFiles, file.id])
                        } else {
                          setSelectedFiles(selectedFiles.filter(id => id !== file.id))
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* File Info */}
                <div className="p-3 min-h-[80px]">
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    {formatSize(file.size)} • {formatDate(file.created_at)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 p-2 border-t border-gray-100 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(file) }}
                    className="flex-1 p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded-lg text-xs font-medium transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 mx-auto mb-0.5" />
                    <span className="block">Download</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(file.id, file.path) }}
                    className="flex-1 p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded-lg text-xs font-medium transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 mx-auto mb-0.5" />
                    <span className="block">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => { handleDownload(contextMenu.file); setContextMenu(null) }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button
              onClick={() => { /* copy link */ setContextMenu(null) }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Copy className="w-4 h-4" /> Copy Link
            </button>
            <button
              onClick={() => { handleDelete(contextMenu.file.id, contextMenu.file.path); setContextMenu(null) }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        )}
      </main>

      {/* Selection Bar */}
      {selectedFiles.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-lg z-20">
          <span>{selectedFiles.length} file(s) selected</span>
          <button
            onClick={() => {
              if (confirm(`Delete ${selectedFiles.length} file(s)?`)) {
                selectedFiles.forEach(id => {
                  const file = files.find(f => f.id === id)
                  if (file) handleDelete(file.id, file.path)
                })
              }
            }}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            Delete Selected
          </button>
        </div>
      )}
    </div>
  )
}