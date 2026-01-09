import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageSquare, Heart, Send, Globe, Users, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import PostComments from "@/components/PostComments";

interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  visibility: string;
  created_at: string;
  profile?: {
    character_name: string;
    character_level: number;
  };
  likes_count: number;
  user_liked: boolean;
}

export default function SocialFeed() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [visibility, setVisibility] = useState<string>("friends");
  const [postType, setPostType] = useState<string>("custom");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Fetch posts with profiles
      const { data: postsData, error } = await supabase
        .from("social_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles and likes for each post
      const enrichedPosts = await Promise.all((postsData || []).map(async (post) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("character_name, character_level")
          .eq("id", post.user_id)
          .single();

        const { count: likesCount } = await supabase
          .from("post_likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        const { data: userLike } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .single();

        return {
          ...post,
          profile,
          likes_count: likesCount || 0,
          user_liked: !!userLike
        };
      }));

      setPosts(enrichedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("social_posts")
        .insert({
          user_id: user.id,
          content: newPost.trim(),
          post_type: postType,
          visibility
        });

      if (error) throw error;

      toast({
        title: "Posted! 📝",
        description: "Your post has been shared."
      });

      setNewPost("");
      loadPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (currentlyLiked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: user.id
          });
      }

      // Update local state
      setPosts(posts.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              user_liked: !currentlyLiked,
              likes_count: currentlyLiked ? p.likes_count - 1 : p.likes_count + 1
            }
          : p
      ));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("social_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Post has been removed."
      });

      loadPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const getVisibilityIcon = (vis: string) => {
    switch (vis) {
      case "public": return <Globe className="w-3 h-3" />;
      case "friends": return <Users className="w-3 h-3" />;
      case "private": return <Lock className="w-3 h-3" />;
      default: return null;
    }
  };

  const getPostTypeEmoji = (type: string) => {
    switch (type) {
      case "achievement": return "🏆";
      case "milestone": return "🎯";
      case "streak": return "🔥";
      case "level_up": return "⬆️";
      default: return "💭";
    }
  };

  if (loading) {
    return <div className="p-8">Loading feed...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Social Feed</h1>
        </div>

        {/* Create Post */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Share an Update</CardTitle>
            <CardDescription>
              Share your progress, achievements, or thoughts with the community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind, adventurer?"
              rows={3}
            />
            <div className="flex gap-4">
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Post type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">💭 General</SelectItem>
                  <SelectItem value="achievement">🏆 Achievement</SelectItem>
                  <SelectItem value="milestone">🎯 Milestone</SelectItem>
                  <SelectItem value="streak">🔥 Streak</SelectItem>
                  <SelectItem value="level_up">⬆️ Level Up</SelectItem>
                </SelectContent>
              </Select>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Public
                    </div>
                  </SelectItem>
                  <SelectItem value="friends">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" /> Friends
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Private
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={createPost} 
                disabled={!newPost.trim() || submitting}
                className="ml-auto"
              >
                <Send className="w-4 h-4 mr-2" />
                Post
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No posts yet. Be the first to share something!
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                        ⚔️
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {post.profile?.character_name || "Adventurer"}
                          <span className="text-xs text-muted-foreground">
                            Lv.{post.profile?.character_level || 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1">
                            {getVisibilityIcon(post.visibility)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-2xl">{getPostTypeEmoji(post.post_type)}</span>
                  </div>

                  <p className="mb-4 whitespace-pre-wrap">{post.content}</p>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(post.id, post.user_liked)}
                        className={post.user_liked ? "text-ruby" : ""}
                      >
                        <Heart 
                          className={`w-4 h-4 mr-1 ${post.user_liked ? "fill-current" : ""}`} 
                        />
                        {post.likes_count}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newExpanded = new Set(expandedComments);
                          if (newExpanded.has(post.id)) {
                            newExpanded.delete(post.id);
                          } else {
                            newExpanded.add(post.id);
                          }
                          setExpandedComments(newExpanded);
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Comments
                        {expandedComments.has(post.id) ? (
                          <ChevronUp className="w-3 h-3 ml-1" />
                        ) : (
                          <ChevronDown className="w-3 h-3 ml-1" />
                        )}
                      </Button>
                    </div>

                    {post.user_id === currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePost(post.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Delete
                      </Button>
                    )}
                  </div>

                  {/* Comments Section */}
                  {expandedComments.has(post.id) && (
                    <PostComments postId={post.id} currentUserId={currentUserId} />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
