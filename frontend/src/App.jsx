import React, { useState } from 'react';

// Recursive component to render the tree
const TreeNode = ({ name, childrenObj }) => {
  const childrenNames = Object.keys(childrenObj);
  
  return (
    <div className="tree-node">
      <div className="node-label">
        <div className="node-circle">{name}</div>
      </div>
      {childrenNames.length > 0 && (
        <div className="children-container">
          {childrenNames.map(childName => (
            <TreeNode key={childName} name={childName} childrenObj={childrenObj[childName]} />
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  const [inputData, setInputData] = useState('[\n  "A->B", "A->C", "B->D", "C->E", "E->F",\n  "X->Y", "Y->Z", "Z->X",\n  "P->Q", "Q->R",\n  "G->H", "G->H", "G->I",\n  "hello", "1->2", "A->"\n]');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setResult(null);
    setLoading(true);

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(inputData);
        if (!Array.isArray(parsedData)) {
          throw new Error('Parsed input is not an array.');
        }
      } catch (err) {
        throw new Error('Invalid JSON format. Please provide a valid JSON array of strings.');
      }

      // Update URL to match your backend when deploying
      const apiUrl = 'http://localhost:5000/bfhl';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: parsedData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Node Hierarchy Processor</h1>
        <p>SRM Full Stack Engineering Challenge</p>
      </header>

      <div className="glass-card">
        <div className="input-group">
          <label htmlFor="nodeInput">Enter Node Array (JSON format):</label>
          <textarea 
            id="nodeInput"
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder='["A->B", "A->C"]'
          />
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : 'Process Hierarchies'}
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      {result && (
        <div className="results-grid">
          {/* Summary Card */}
          <div className="glass-card summary-card">
            <h2>Analysis Summary</h2>
            <div className="summary-stats">
              <div className="stat-item">
                <div className="stat-value">{result.summary.total_trees}</div>
                <div className="stat-label">Valid Trees</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{result.summary.total_cycles}</div>
                <div className="stat-label">Cycles Detected</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{result.summary.largest_tree_root || '-'}</div>
                <div className="stat-label">Largest Root</div>
              </div>
            </div>

            <div className="list-container" style={{ marginTop: '2rem' }}>
              <h3>Invalid Entries</h3>
              <div style={{ marginTop: '0.5rem' }}>
                {result.invalid_entries.length > 0 ? (
                  result.invalid_entries.map((entry, idx) => (
                    <span key={idx} className="badge error">{entry}</span>
                  ))
                ) : (
                  <span className="text-muted">None</span>
                )}
              </div>
            </div>

            <div className="list-container">
              <h3>Duplicate Edges</h3>
              <div style={{ marginTop: '0.5rem' }}>
                {result.duplicate_edges.length > 0 ? (
                  result.duplicate_edges.map((edge, idx) => (
                    <span key={idx} className="badge warning">{edge}</span>
                  ))
                ) : (
                  <span className="text-muted">None</span>
                )}
              </div>
            </div>
            
            <div className="list-container" style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
               <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>User: {result.user_id}</p>
               <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Email: {result.email_id}</p>
               <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Roll: {result.college_roll_number}</p>
            </div>
          </div>

          {/* Hierarchies Card */}
          <div className="glass-card">
            <h2>Hierarchies</h2>
            <div className="tree-container">
              {result.hierarchies.length > 0 ? (
                result.hierarchies.map((hierarchy, idx) => (
                  <div key={idx} className="tree-root-card">
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', justifyContent: 'space-between' }}>
                      <h3 style={{ margin: 0 }}>Root: {hierarchy.root}</h3>
                      {hierarchy.has_cycle ? (
                        <span className="cycle-warning">⚠️ Cycle Detected</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Depth: {hierarchy.depth}</span>
                      )}
                    </div>
                    
                    {!hierarchy.has_cycle && hierarchy.tree[hierarchy.root] && (
                       <div style={{ marginLeft: '-1rem' }}>
                          <TreeNode name={hierarchy.root} childrenObj={hierarchy.tree[hierarchy.root]} />
                       </div>
                    )}
                  </div>
                ))
              ) : (
                <p>No valid hierarchies found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
