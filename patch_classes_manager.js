const fs = require('fs');
let code = fs.readFileSync('components/ClassesManager.tsx', 'utf8');

const targetStr = `            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">`;

const replacementStr = `            ) : (
              <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right text-xs">`;

code = code.replace(targetStr, replacementStr);

const targetStrEnd = `                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}`;

const replacementStrEnd = `                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Cards */}
              <div className="block md:hidden divide-y divide-slate-100">
                {classStudents.map(student => (
                  <div key={student.id} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                        {student.numberInList}
                      </span>
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-slate-900">
                          {student.fullName}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={\`px-2 py-0.5 rounded text-[10px] font-semibold \${
                              student.gender === 'F'
                                ? 'bg-pink-50 text-pink-700'
                                : 'bg-blue-50 text-blue-700'
                            }\`}
                          >
                            {student.gender === 'F' ? 'أنثى' : 'ذكر'}
                          </span>
                          {student.registrationNumber && (
                            <span className="font-mono text-slate-500 text-[10px]">
                              {student.registrationNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingStudent({ ...student });
                          setIsStudentModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer bg-slate-50 rounded-lg"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => promptDeleteStudent(student)}
                        className="p-2 text-rose-400 hover:text-rose-600 cursor-pointer bg-rose-50 rounded-lg"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        </div>
      )}`;

code = code.replace(targetStrEnd, replacementStrEnd);
fs.writeFileSync('components/ClassesManager.tsx', code);
console.log("Patched ClassesManager.tsx");
