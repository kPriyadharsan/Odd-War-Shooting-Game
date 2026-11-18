import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe2, RefreshCw, Users, PlusCircle, Search, ArrowLeft, ArrowRight, AlertCircle, BookOpen } from 'lucide-react';
import {
  NotebookBackground,
  Button,
  IconButton,
  Card,
  Input,
  LoadingIndicator
} from '../../components/ui/index.js';
import { roomApi } from '../../services/roomApi.js';
import { getPlayerSession } from '../../store/playerSession.js';

export const PublicRoomsPage = () => {
  const navigate = useNavigate();
  const player = getPlayerSession();

  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [joiningCode, setJoiningCode] = useState(null);

  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await roomApi.listPublicRooms();
      setRooms(data);
    } catch (err) {
      setError(err.message || 'Failed to load public rooms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleJoin = async (code) => {
    setJoiningCode(code);
    setError(null);
    try {
      const joined = await roomApi.joinRoom({
        code,
        player
      });
      navigate(`/rooms/${joined.code}`);
    } catch (err) {
      setError(err.message || 'Could not join room');
      setJoiningCode(null);
      // Refresh list in case room filled up
      fetchRooms();
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.hostNickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <NotebookBackground showMargin={true} className="py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pl-12 sm:pl-20">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#5C6069] hover:text-[#23252A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Room Hub</span>
          </Link>

          <Link to="/rooms/create">
            <Button variant="primary" size="sm" icon={PlusCircle}>
              Create Public Room
            </Button>
          </Link>
        </div>

        {/* Header */}
        <header className="mb-8 border-b border-[#D5CFC3] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase text-[#2B68B4] mb-1">
              <Globe2 className="w-3.5 h-3.5" />
              <span>Public Battle Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-handwriting font-bold tracking-tight text-[#23252A]">
              Open Notebook Sheets
            </h1>
            <p className="mt-1 text-sm text-[#5C6069] font-sans">
              Join open lobbies hosted by other players. Max 4 warriors per sheet.
            </p>
          </div>

          {/* Refresh Action */}
          <IconButton
            icon={RefreshCw}
            variant="secondary"
            title="Refresh list"
            onClick={fetchRooms}
            disabled={isLoading}
          />
        </header>

        {/* Search & Stats Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:max-w-xs">
            <Input
              icon={Search}
              placeholder="Search room, host, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="text-xs font-mono text-[#5C6069] flex items-center gap-2">
            <span>Available Sheets:</span>
            <span className="font-bold text-[#23252A] bg-[#EFE8DA] px-2 py-0.5 rounded border border-[#D5CFC3]">
              {rooms.length}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#FDF2F2] border border-[#CE4242] text-[#CE4242] text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs underline hover:no-underline font-mono"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Rooms Listing */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <LoadingIndicator size="lg" label="Searching for open paper sheets..." />
          </div>
        ) : filteredRooms.length === 0 ? (
          /* Empty State */
          <Card variant="ruled" padding="lg" className="text-center py-16 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-[#EFE8DA] border border-[#D5CFC3] flex items-center justify-center mb-4 text-[#5C6069]">
              <Globe2 className="w-6 h-6" />
            </div>

            <h3 className="text-2xl font-handwriting font-bold text-[#23252A] mb-2">
              {searchQuery ? 'No matching rooms found' : 'No Public Rooms Open'}
            </h3>

            <p className="text-sm text-[#5C6069] max-w-md mb-6 font-sans">
              {searchQuery
                ? `No open rooms matched "${searchQuery}". Try a different keyword or create your own.`
                : 'There are currently no active public sheets awaiting players. Open a new battle sheet to lead the fight!'}
            </p>

            <Link to="/rooms/create">
              <Button variant="primary" size="md" icon={PlusCircle}>
                Host a New Room
              </Button>
            </Link>
          </Card>
        ) : (
          /* Rooms Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room) => {
              const isJoiningThis = joiningCode === room.code;
              const isFull = room.playerCount >= room.maxPlayers;

              return (
                <Card
                  key={room.code}
                  variant="default"
                  padding="md"
                  className="flex flex-col justify-between hover:border-[#23252A] transition-all"
                >
                  <div>
                    {/* Header: Code & Status */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#EFE8DA] border border-[#D5CFC3] text-[#23252A]">
                          {room.code}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FCFAF3] border border-[#D5CFC3] text-[#5C6069]">
                          <BookOpen className="w-3 h-3 text-[#2B68B4]" />
                          <span>{room.bookPageCount || 100}p</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#F0F7F3] border border-[#2E8557]/30 text-[#2E8557] font-semibold">
                        {room.status}
                      </span>
                    </div>

                    {/* Room Name */}
                    <h3 className="text-xl font-handwriting font-bold text-[#23252A] mb-1 truncate" title={room.name}>
                      {room.name}
                    </h3>

                    {/* Host info */}
                    <div className="text-xs text-[#5C6069] font-sans mb-4">
                      Host: <strong className="text-[#23252A]">{room.hostNickname}</strong>
                    </div>

                    {/* Players Progress Bar */}
                    <div className="space-y-1.5 mb-5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#5C6069] flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>Squad:</span>
                        </span>
                        <span className="font-bold text-[#23252A]">
                          {room.playerCount} / {room.maxPlayers}
                        </span>
                      </div>

                      {/* Visual slot dots */}
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: room.maxPlayers }).map((_, slotIdx) => (
                          <div
                            key={slotIdx}
                            className={`flex-1 h-2 rounded-full transition-colors ${
                              slotIdx < room.playerCount
                                ? 'bg-[#2B68B4]'
                                : 'bg-[#E5DFD3]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Join Action */}
                  <Button
                    variant="primary"
                    size="sm"
                    icon={ArrowRight}
                    iconPosition="right"
                    disabled={isFull || isJoiningThis}
                    isLoading={isJoiningThis}
                    onClick={() => handleJoin(room.code)}
                    className="w-full"
                  >
                    {isFull ? 'Room Full' : 'Join Battle'}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </NotebookBackground>
  );
};

export default PublicRoomsPage;
