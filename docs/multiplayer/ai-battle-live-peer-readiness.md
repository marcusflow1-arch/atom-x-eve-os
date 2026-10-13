# Luna AI Battle peer-readiness repair

The two-browser test revealed delayed arena entry followed by a player who could not see the other move. This is a connection problem, not only a smoothing problem.

The repair seeds the 1:1 WebRTC connection directly from the known PvP match roster instead of waiting for the 15-second social presence update. Failed peer links retry. The arena only reports readiness when both character models and the data channel are available; the server still decides when both players start. Packet sequence history resets after a peer reloads.

To verify, sign in using two distinct accounts, queue for PvP, and confirm each player sees the other's movement during the countdown and fight. Reload one browser and verify movement resumes on the other. Test basic attacks and Chidori as well.

If the connecting overlay persists, the data link is not established and a server relay may be needed. Current networking remains WebRTC; these changes do not migrate AI Battle to Railway. Revert this pull request if needed. The movement-only flag aibattlesmooth=0 remains available.
