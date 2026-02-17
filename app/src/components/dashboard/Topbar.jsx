function Topbar({ onLogout }) {
	return (
		<div className="topbar">
			<div>
				<h2>Retail Dashboard</h2>
				<span className="topbar-subtitle">Overview</span>
			</div>

			<button type="button" className="logout-btn" onClick={onLogout}>
				Log out
			</button>
		</div>
	);
}

export default Topbar;
