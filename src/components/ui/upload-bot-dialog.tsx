import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { insertBotSchema } from "@shared/schema";
import { createBot } from "@/lib/discord-bot";
import { BotType, IconType } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UploadBotDialogProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
  onBotCreated?: () => void;
}

export function UploadBotDialog({ userId, isOpen, onClose, onBotCreated }: UploadBotDialogProps) {
  const [botName, setBotName] = useState("");
  const [token, setToken] = useState("");
  const [prefix, setPrefix] = useState("!");
  const [botType, setBotType] = useState<BotType>(BotType.CUSTOM);
  const [iconType, setIconType] = useState<IconType>(IconType.ROBOT);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [botDescription, setBotDescription] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, content: string}[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const { toast } = useToast();

  const handleFileUpload = (file: File, content: string) => {
    // Add the file to the uploaded files array
    const newFiles = [...uploadedFiles, { name: file.name, content: content }];
    setUploadedFiles(newFiles);
    
    // If this is the first file uploaded, set it as active
    if (newFiles.length === 1) {
      setActiveFileIndex(0);
      setFileName(file.name);
      setFileContent(content);
      
      // If bot name is empty, use the file name without extension
      if (!botName) {
        const nameWithoutExt = file.name.split('.')[0];
        setBotName(nameWithoutExt.replace(/_/g, ' ').replace(/-/g, ' '));
      }
      
      // Try to auto-detect bot type based on imports in the file
      if (content.includes("moderation") || content.includes("admin") || content.includes("ban") || content.includes("kick")) {
        setBotType(BotType.MODERATION);
        setIconType(IconType.SHIELD);
      } else if (content.includes("music") || content.includes("play") || content.includes("song") || content.includes("youtube")) {
        setBotType(BotType.MUSIC);
        setIconType(IconType.MUSIC);
      } else if (content.includes("game") || content.includes("play") || content.includes("score")) {
        setBotType(BotType.GAMING);
        setIconType(IconType.GAMEPAD);
      }
      
      // Try to detect the prefix
      const prefixMatch = content.match(/prefix\s*=\s*['"](.*?)['"]/);
      if (prefixMatch && prefixMatch[1]) {
        setPrefix(prefixMatch[1]);
      }
    } else {
      // Notify user that multiple files were uploaded
      toast({
        title: "Multiple files uploaded",
        description: `${newFiles.length} files have been uploaded. Main file is set to ${fileName || newFiles[0].name}.`,
        variant: "default"
      });
    }
  };
  
  const handleSubmit = async () => {
    try {
      if (!fileContent) {
        toast({
          title: "Missing files",
          description: "Please upload at least one Discord bot Python file",
          variant: "destructive"
        });
        return;
      }
      
      if (!botName || !token) {
        toast({
          title: "Missing fields",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }
      
      setIsSubmitting(true);
      
      // Create bot data to submit
      const botData = {
        name: botName,
        description: botDescription || `Custom bot created from ${fileName || 'uploaded file'}`,
        token,
        prefix,
        userId,
        botType,
        iconType,
        scriptContent: fileContent,
        scriptFileName: fileName || undefined,
        // Add additional files if there are more than one
        additionalFiles: uploadedFiles.length > 1 
          ? uploadedFiles
              .filter((_, index) => index !== activeFileIndex) // Filter out the main file
              .map(file => ({ name: file.name, content: file.content }))
          : undefined
      };
      
      // Submit bot to API
      const newBot = await createBot(botData);
      
      toast({
        title: "Bot created",
        description: `${botName} has been successfully created`,
        variant: "default"
      });
      
      // Add 24/7 uptime message
      toast({
        title: "24/7 Uptime Guaranteed",
        description: "Your bot will remain online 24/7 even when you log out of the dashboard.",
      });
      
      // Call the callback
      if (onBotCreated) {
        onBotCreated();
      }
      
      // Reset form and close dialog
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating bot:", error);
      toast({
        title: "Failed to create bot",
        description: "There was an error creating your bot. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setBotName("");
    setToken("");
    setPrefix("!");
    setBotType(BotType.CUSTOM);
    setIconType(IconType.ROBOT);
    setFileContent(null);
    setFileName(null);
    setBotDescription("");
    setUploadedFiles([]);
    setActiveFileIndex(0);
  };
  
  const selectMainFile = (index: number) => {
    if (index >= 0 && index < uploadedFiles.length) {
      setActiveFileIndex(index);
      setFileName(uploadedFiles[index].name);
      setFileContent(uploadedFiles[index].content);
      
      // Update bot name if it's not set
      if (!botName) {
        const nameWithoutExt = uploadedFiles[index].name.split('.')[0];
        setBotName(nameWithoutExt.replace(/_/g, ' ').replace(/-/g, ' '));
      }
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background-light sm:max-w-[600px] border border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text">Upload Discord Bot</DialogTitle>
          <DialogDescription>
            Upload your Python Discord bot files and configure them for hosting. You can upload multiple files and select a main file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {!fileContent ? (
            // File upload section
            <FileUpload 
              onFileUpload={handleFileUpload} 
              accept=".py" 
              maxSize={10}
              multiple={true}
              label="Upload Discord Bot Files"
              description="Drag and drop your Discord bot Python files here (multiple files allowed, up to 10MB each)"
              icon={<i className="fas fa-python text-3xl text-secondary"></i>}
            />
          ) : (
            // Bot configuration section after file is uploaded
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium neon-text">Bot Configuration</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setFileContent(null);
                    setFileName(null);
                    setUploadedFiles([]);
                    setActiveFileIndex(0);
                  }}
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Change Files
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bot-name">Bot Name</Label>
                    <Input
                      id="bot-name"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="My Cool Bot"
                      className="bg-background"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bot-desc">Description (optional)</Label>
                    <Input
                      id="bot-desc"
                      value={botDescription}
                      onChange={(e) => setBotDescription(e.target.value)}
                      placeholder="A short description of what your bot does"
                      className="bg-background"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bot-token">Bot Token</Label>
                    <Input
                      id="bot-token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Discord Bot Token"
                      className="bg-background"
                      type="password"
                    />
                    <p className="text-xs text-gray-400">
                      Get your token from the <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">Discord Developer Portal</a>
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bot-prefix">Command Prefix</Label>
                      <Input
                        id="bot-prefix"
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        placeholder="!"
                        className="bg-background"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bot-type">Bot Type</Label>
                      <Select
                        value={botType}
                        onValueChange={(value) => {
                          setBotType(value as BotType);
                          // Update icon type based on bot type
                          switch (value) {
                            case BotType.MUSIC:
                              setIconType(IconType.MUSIC);
                              break;
                            case BotType.MODERATION:
                              setIconType(IconType.SHIELD);
                              break;
                            case BotType.GAMING:
                              setIconType(IconType.GAMEPAD);
                              break;
                            default:
                              setIconType(IconType.ROBOT);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={BotType.CUSTOM}>Custom</SelectItem>
                          <SelectItem value={BotType.MODERATION}>Moderation</SelectItem>
                          <SelectItem value={BotType.MUSIC}>Music</SelectItem>
                          <SelectItem value={BotType.GAMING}>Gaming</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bot-icon">Icon</Label>
                    <div className="grid grid-cols-5 gap-3">
                      {Object.values(IconType).map((icon) => (
                        <div 
                          key={icon}
                          className={`cursor-pointer p-3 rounded-md flex justify-center items-center transition-all ${
                            iconType === icon 
                              ? 'bg-secondary/30 border border-secondary/50 neon-glow' 
                              : 'bg-background hover:bg-background-light/50 border border-border'
                          }`}
                          onClick={() => setIconType(icon as IconType)}
                        >
                          <i className={`fas fa-${icon} text-xl ${iconType === icon ? 'text-secondary' : 'text-gray-400'}`}></i>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 1 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Bot Files</Label>
                        <p className="text-xs text-gray-400">Select main file</p>
                      </div>
                      <div className="max-h-40 overflow-y-auto bg-background rounded-md border border-gray-800 p-1">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-all ${
                              index === activeFileIndex
                                ? 'bg-secondary/20 border-l-2 border-secondary'
                                : 'hover:bg-background-light'
                            }`}
                            onClick={() => selectMainFile(index)}
                          >
                            <div className="flex items-center">
                              <i className="fas fa-file-code text-secondary mr-2"></i>
                              <span className={index === activeFileIndex ? 'text-white' : 'text-gray-400'}>
                                {file.name}
                              </span>
                            </div>
                            {index === activeFileIndex && (
                              <span className="text-xs bg-secondary/30 text-secondary px-2 py-1 rounded">
                                Main
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        {uploadedFiles.length} files uploaded • {fileName} set as main file
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        {fileContent && (
          <DialogFooter>
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-secondary hover:bg-secondary/80"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-rocket mr-2"></i>
                  Create Bot
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}