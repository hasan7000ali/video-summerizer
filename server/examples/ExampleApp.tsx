import React, { useState, useEffect } from 'react';
import VideoUploader from './VideoUploader';
import './App.css';

const ExampleApp: React.FC = () => {
  const [authToken, setAuthToken] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const apiBaseUrl = 'http://localhost:3000';

  useEffect(() => {
    // Check if token exists in local storage
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
      setIsLoggedIn(true);
      fetchVideos(token);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data.token) {
        setAuthToken(data.data.token);
        localStorage.setItem('authToken', data.data.token);
        setIsLoggedIn(true);
        fetchVideos(data.data.token);
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred while logging in');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken('');
    setIsLoggedIn(false);
    localStorage.removeItem('authToken');
  };

  const fetchVideos = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/videos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setVideos(data.data);
      } else {
        console.error('Failed to fetch videos:', data.message);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (videoId: string) => {
    // Refresh video list after successful upload
    fetchVideos(authToken);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  return (
    <div className="app-container">
      <header>
        <h1>AI Video Summarizer</h1>
        {isLoggedIn && (
          <button onClick={handleLogout} className="logout-button">Logout</button>
        )}
      </header>

      <main>
        {!isLoggedIn ? (
          <div className="login-container">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        ) : (
          <div className="dashboard">
            <VideoUploader
              authToken={authToken}
              apiBaseUrl={apiBaseUrl}
              onUploadComplete={handleUploadComplete}
            />

            <div className="videos-container">
              <h2>Your Videos</h2>
              {loading ? (
                <p>Loading videos...</p>
              ) : videos.length === 0 ? (
                <p>No videos found. Upload your first video!</p>
              ) : (
                <div className="video-grid">
                  {videos.map((video) => (
                    <div key={video.id} className="video-card">
                      <div className="video-thumbnail">
                        {video.thumbnailUrl ? (
                          <img src={video.thumbnailUrl} alt={video.title} />
                        ) : (
                          <div className="placeholder-thumbnail">
                            <span>{video.status}</span>
                          </div>
                        )}
                      </div>
                      <div className="video-details">
                        <h3>{video.title}</h3>
                        <p className="video-description">{video.description || 'No description'}</p>
                        <p className="video-meta">
                          Size: {formatFileSize(video.fileSize)}
                          <br />
                          Status: {video.status}
                          <br />
                          Created: {new Date(video.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>&copy; {new Date().getFullYear()} AI Video Summarizer</p>
      </footer>
      
      <style jsx>{`
        .app-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .login-container {
          max-width: 400px;
          margin: 0 auto;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
        }
        
        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        button {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:hover {
          background-color: #45a049;
        }
        
        .logout-button {
          background-color: #f44336;
        }
        
        .logout-button:hover {
          background-color: #d32f2f;
        }
        
        .video-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .video-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .video-thumbnail {
          height: 180px;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .placeholder-thumbnail {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #e0e0e0;
          color: #666;
        }
        
        .video-details {
          padding: 15px;
        }
        
        .video-description {
          color: #666;
          margin: 10px 0;
          font-size: 14px;
          height: 40px;
          overflow: hidden;
        }
        
        .video-meta {
          font-size: 12px;
          color: #888;
        }
        
        footer {
          margin-top: 50px;
          text-align: center;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default ExampleApp; 