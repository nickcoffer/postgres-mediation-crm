"use client";

type MIAMSummaryProps = {
  sessionData: any;
  caseReference?: string;
  caseTitle?: string;
};

export default function MIAMSummaryDisplay({ sessionData, caseReference, caseTitle }: MIAMSummaryProps) {
  // Try to parse the MIAM summary from the notes field
  let miamData: any = null;
  let parseError: string | null = null;
  
  try {
    const notes = sessionData.notes || "";
    console.log("Session notes:", notes); // Debug log
    
    // Look for "MIAM Summary" header and JSON
    const jsonMatch = notes.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      console.log("Found JSON:", jsonMatch[0]); // Debug log
      miamData = JSON.parse(jsonMatch[0]);
      console.log("Parsed MIAM data:", miamData); // Debug log
    } else {
      parseError = "No JSON data found in notes";
    }
  } catch (e) {
    console.error("Could not parse MIAM data", e);
    parseError = String(e);
  }

  if (!miamData) {
    return (
      <div className="text-sm space-y-2">
        <div className="text-gray-600">
          {sessionData.notes || "No notes available"}
        </div>
        {parseError && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            Debug: {parseError}
          </div>
        )}
      </div>
    );
  }

  function exportAsPDF() {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const sessionDate = sessionData.start 
      ? new Date(sessionData.start).toLocaleDateString('en-GB')
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MIAM Summary - ${caseReference || 'Case'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
          }
          h1 {
            color: #1f2937;
            border-bottom: 3px solid #0891b2;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          h2 {
            color: #0891b2;
            margin-top: 25px;
            margin-bottom: 15px;
            font-size: 18px;
          }
          .header-info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
          }
          .header-info p {
            margin: 5px 0;
          }
          .section {
            margin-bottom: 20px;
          }
          .checkbox-list {
            margin: 10px 0;
          }
          .checkbox-item {
            margin: 5px 0;
          }
          .checked::before {
            content: "✓ ";
            color: #059669;
            font-weight: bold;
          }
          .unchecked::before {
            content: "☐ ";
            color: #9ca3af;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 10px;
            text-align: left;
          }
          th {
            background: #f3f4f6;
            font-weight: 600;
          }
          .notes-box {
            background: #f9fafb;
            border-left: 4px solid #0891b2;
            padding: 15px;
            margin: 10px 0;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <h1>MIAM / Intake Summary</h1>
        
        <div class="header-info">
          ${caseReference ? `<p><strong>Case Reference:</strong> ${caseReference}</p>` : ''}
          ${caseTitle ? `<p><strong>Case:</strong> ${caseTitle}</p>` : ''}
          ${sessionDate ? `<p><strong>MIAM Date:</strong> ${sessionDate}</p>` : ''}
        </div>

        <div class="section">
          <h2>Participant Information</h2>
          <p><strong>Name:</strong> ${miamData.participant || '—'}</p>
          ${miamData.participant_dob ? `<p><strong>Date of Birth:</strong> ${new Date(miamData.participant_dob).toLocaleDateString('en-GB')} (Age ${miamData.participant_age || '—'})</p>` : ''}
        </div>

        ${miamData.general_notes ? `
        <div class="section">
          <h2>General Notes</h2>
          <div class="notes-box">${miamData.general_notes}</div>
        </div>
        ` : ''}

        <div class="section">
          <h2>Relationship History</h2>
          <div class="checkbox-list">
            <div class="checkbox-item ${miamData.relationship_history?.married ? 'checked' : 'unchecked'}">Married</div>
            <div class="checkbox-item ${miamData.relationship_history?.separated ? 'checked' : 'unchecked'}">Separated</div>
            <div class="checkbox-item ${miamData.relationship_history?.conditional_order ? 'checked' : 'unchecked'}">Conditional Order</div>
            <div class="checkbox-item ${miamData.relationship_history?.final_order ? 'checked' : 'unchecked'}">Final Order</div>
          </div>
        </div>

        <div class="section">
          <h2>Key Dates</h2>
          ${miamData.key_dates?.marriage_date ? `<p><strong>Marriage:</strong> ${new Date(miamData.key_dates.marriage_date).toLocaleDateString('en-GB')}</p>` : ''}
          ${miamData.key_dates?.separation_date ? `<p><strong>Separation:</strong> ${new Date(miamData.key_dates.separation_date).toLocaleDateString('en-GB')}</p>` : ''}
          ${miamData.key_dates?.divorce_date ? `<p><strong>Divorce:</strong> ${new Date(miamData.key_dates.divorce_date).toLocaleDateString('en-GB')}</p>` : ''}
        </div>

        ${miamData.children?.length ? `
        <div class="section">
          <h2>Children</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date of Birth</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              ${miamData.children.map((child: any) => `
                <tr>
                  <td>${child.name || '—'}</td>
                  <td>${child.dob ? new Date(child.dob).toLocaleDateString('en-GB') : '—'}</td>
                  <td>${child.age || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${miamData.wishes ? `
        <div class="section">
          <h2>Participant's Wishes</h2>
          ${miamData.wishes.child_arrangements ? `
            <div>
              <strong>Child Arrangements:</strong>
              <div class="notes-box">${miamData.wishes.child_arrangements}</div>
            </div>
          ` : ''}
          ${miamData.wishes.finances ? `
            <div style="margin-top: 15px;">
              <strong>Finances:</strong>
              <div class="notes-box">${miamData.wishes.finances}</div>
            </div>
          ` : ''}
        </div>
        ` : ''}

        <div class="section">
          <h2>Screening</h2>
          <div class="checkbox-list">
            <div class="checkbox-item ${miamData.screened_for?.child_protection ? 'checked' : 'unchecked'}">Child protection</div>
            <div class="checkbox-item ${miamData.screened_for?.safety_in_mediation ? 'checked' : 'unchecked'}">Safety whilst in mediation</div>
            <div class="checkbox-item ${miamData.screened_for?.mental_health ? 'checked' : 'unchecked'}">Mental health</div>
            <div class="checkbox-item ${miamData.screened_for?.disability ? 'checked' : 'unchecked'}">Disability</div>
            <div class="checkbox-item ${miamData.screened_for?.emotional_readiness ? 'checked' : 'unchecked'}">Emotional readiness</div>
          </div>
        </div>

        <div class="section">
          <h2>Signposting</h2>
          <div class="checkbox-list">
            <div class="checkbox-item ${miamData.signposting_for?.child_maintenance ? 'checked' : 'unchecked'}">Child Maintenance</div>
            <div class="checkbox-item ${miamData.signposting_for?.welfare_benefits ? 'checked' : 'unchecked'}">Welfare benefits</div>
            <div class="checkbox-item ${miamData.signposting_for?.cab ? 'checked' : 'unchecked'}">CAB</div>
            <div class="checkbox-item ${miamData.signposting_for?.debt_support ? 'checked' : 'unchecked'}">Debt support</div>
            <div class="checkbox-item ${miamData.signposting_for?.gp ? 'checked' : 'unchecked'}">GP</div>
          </div>
        </div>

        <div class="section">
          <h2>Conclusion</h2>
          <div class="checkbox-list">
            <div class="checkbox-item ${miamData.conclusion?.emotionally_ready ? 'checked' : 'unchecked'}">Emotionally ready</div>
            <div class="checkbox-item ${miamData.conclusion?.suitable_for_mediation ? 'checked' : 'unchecked'}">Suitable for mediation</div>
            <div class="checkbox-item ${miamData.conclusion?.children ? 'checked' : 'unchecked'}">Children issues</div>
            <div class="checkbox-item ${miamData.conclusion?.finances ? 'checked' : 'unchecked'}">Finance issues</div>
            <div class="checkbox-item ${miamData.conclusion?.aim ? 'checked' : 'unchecked'}">AIM</div>
            <div class="checkbox-item ${miamData.conclusion?.contact_p2 ? 'checked' : 'unchecked'}">Contact Party 2</div>
            <div class="checkbox-item ${miamData.conclusion?.online ? 'checked' : 'unchecked'}">Online mediation</div>
            <div class="checkbox-item ${miamData.conclusion?.shared_space ? 'checked' : 'unchecked'}">Shared space</div>
            <div class="checkbox-item ${miamData.conclusion?.separate_space ? 'checked' : 'unchecked'}">Separate space</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">MIAM Summary</h3>
        <button
          onClick={exportAsPDF}
          className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 flex items-center gap-2"
        >
          📄 Export as PDF
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        {/* Participant */}
        <div>
          <h4 className="font-medium text-teal-700 mb-2">Participant Information</h4>
          <p className="text-sm"><strong>Name:</strong> {miamData.participant || '—'}</p>
          {miamData.participant_dob && (
            <p className="text-sm">
              <strong>DOB:</strong> {new Date(miamData.participant_dob).toLocaleDateString('en-GB')} 
              (Age {miamData.participant_age || '—'})
            </p>
          )}
        </div>

        {/* General Notes */}
        {miamData.general_notes && (
          <div>
            <h4 className="font-medium text-teal-700 mb-2">General Notes</h4>
            <div className="bg-white p-3 rounded border-l-4 border-teal-500 text-sm">
              {miamData.general_notes}
            </div>
          </div>
        )}

        {/* Relationship History */}
        <div>
          <h4 className="font-medium text-teal-700 mb-2">Relationship History</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(miamData.relationship_history || {}).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className={value ? "text-green-600" : "text-gray-400"}>
                  {value ? "✓" : "☐"}
                </span>
                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Dates */}
        {(miamData.key_dates?.marriage_date || miamData.key_dates?.separation_date || miamData.key_dates?.divorce_date) && (
          <div>
            <h4 className="font-medium text-teal-700 mb-2">Key Dates</h4>
            <div className="text-sm space-y-1">
              {miamData.key_dates?.marriage_date && (
                <p><strong>Marriage:</strong> {new Date(miamData.key_dates.marriage_date).toLocaleDateString('en-GB')}</p>
              )}
              {miamData.key_dates?.separation_date && (
                <p><strong>Separation:</strong> {new Date(miamData.key_dates.separation_date).toLocaleDateString('en-GB')}</p>
              )}
              {miamData.key_dates?.divorce_date && (
                <p><strong>Divorce:</strong> {new Date(miamData.key_dates.divorce_date).toLocaleDateString('en-GB')}</p>
              )}
            </div>
          </div>
        )}

        {/* Children */}
        {miamData.children && miamData.children.length > 0 && (
          <div>
            <h4 className="font-medium text-teal-700 mb-2">Children</h4>
            <div className="bg-white rounded border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">DOB</th>
                    <th className="text-left p-2 font-medium">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {miamData.children.map((child: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{child.name || '—'}</td>
                      <td className="p-2">
                        {child.dob ? new Date(child.dob).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="p-2">{child.age || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Wishes */}
        {miamData.wishes && (
          <div>
            <h4 className="font-medium text-teal-700 mb-2">Participant's Wishes</h4>
            {miamData.wishes.child_arrangements && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Child Arrangements:</p>
                <div className="bg-white p-3 rounded text-sm">{miamData.wishes.child_arrangements}</div>
              </div>
            )}
            {miamData.wishes.finances && (
              <div>
                <p className="text-sm font-medium mb-1">Finances:</p>
                <div className="bg-white p-3 rounded text-sm">{miamData.wishes.finances}</div>
              </div>
            )}
          </div>
        )}

        {/* Screening */}
        <div>
          <h4 className="font-medium text-teal-700 mb-2">Screening</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(miamData.screened_for || {}).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className={value ? "text-green-600" : "text-gray-400"}>
                  {value ? "✓" : "☐"}
                </span>
                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signposting */}
        <div>
          <h4 className="font-medium text-teal-700 mb-2">Signposting</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(miamData.signposting_for || {}).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className={value ? "text-green-600" : "text-gray-400"}>
                  {value ? "✓" : "☐"}
                </span>
                <span className="uppercase">{key.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conclusion */}
        <div>
          <h4 className="font-medium text-teal-700 mb-2">Conclusion</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(miamData.conclusion || {}).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className={value ? "text-green-600" : "text-gray-400"}>
                  {value ? "✓" : "☐"}
                </span>
                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
